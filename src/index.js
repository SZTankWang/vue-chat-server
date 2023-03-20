import express from "express"
import cors from "cors"
import {
    validateUser,
    createUser,
    findAllUsers,
    storeMessage}
    from "./database/database.ts"
import { signJWT,verifyJWT } from "./auth.ts"
import { createWS,sendMessage } from "./websocket/websocket.ts"
import http, { Server } from "http"
import cookieParser from "cookie-parser"

const app = express()
const port = 3000

app.use(cors({credentials:true,origin:true}))
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(cookieParser())
//websocket server 
const httpServer = http.createServer(app)
const wss = createWS()

const sockets = new Map()

//登陆逻辑
app.post("/authenticate",(req,res)=>{
    console.log(req.body);
    let username = req.body["username"];
    let password = req.body["password"];
    let status=200;
    let jwt="";
    let id=null;
    //search for user 
    (async function(){
        const result = await validateUser(username,password)
        //if doesn't exist, create one
        if(result==null){
            //create new 
            let insertResult= await createUser(username,password);
            if(insertResult.acknowledged){
                console.log("inserted",insertResult.insertedId);
                id = insertResult.insertedId.toString();
                status = 200
                //create jwt 
                jwt = signJWT({username:username,id:id})
            }
            else{
                console.log("insertion failed")
                status = 500
            }
        }
        else{
            console.log("user exist",result)
            id = result._id.toString()
            //create jwt 
            jwt = signJWT({username:username,id:id})
        }
        setTimeout(()=>res.status(status).cookie("token",jwt,{httpOnly:true,sameSite:"None",secure:true}).json({id:id}),2000)
    })()

    

})
app.use("/users",(req,res,next)=>{
    console.log("validating token",req.cookies)
    if(verifyJWT(req.cookies.token)!==undefined){
        next()
    }
    else{
        console.log("illegal request")
        res.status(401).send("illegal request")
    }
})

//查找用户列表逻辑
app.get("/users",(req,res)=>{ 
    //查找所有用户
    (async function(){
        const user = await findAllUsers();
        res.status(200).json({data:user});
    })()
})

//websocket setup
httpServer.on("upgrade",function(request,socket,head){
    console.log(request.headers.cookie)
    const cookies = request.headers.cookie.slice(6)
    //perform authentication here 
    // console.log(cookies)
    const result = verifyJWT(cookies)
    //wss handleupgrade
    if(result!==undefined){

        wss.handleUpgrade(request,socket,head,function(ws){
            wss.emit("connection",ws,request,result.id)
            //rememeber the user
            console.log("validation result",result)
            console.log(`remembering ${result.id}` )
            
            sockets.set(result.id,ws)
        })
    }

})

wss.on("connection",function(ws,request,id){
    console.log("web socket: connection established, userid:",id)


    ws.on("message",function(message){
        //where does this come from? 
        //in the message: senderID-recvrID-content
        console.log(`receiving ${message}`)
        //transmit to the other party 
        sendMessage(message,sockets);
        //write to db 
        storeMessage(message)

    })

    ws.on("close",function(code,reason){
        //remove this socket from the socket map 
        if(sockets.delete(id)){
            console.log(`${id}'s socket deleted`)
        }else{
            console.log("socket doesn't exist")
        }
    })

})


httpServer.listen(port,()=>{
    console.log("server is up and running")
})

