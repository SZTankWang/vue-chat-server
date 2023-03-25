import { MongoClient } from "mongodb";
import util from "node:util";

const decoder = new util.TextDecoder();


const uri = "mongodb+srv://zhenmingwang:sfls2012101@cluster0.mgy0es3.mongodb.net/?retryWrites=true&w=majority"
const client = new MongoClient(uri)

export enum AuthResult{
  Success=1,
  WrongPassword=2,
  NonExist=3
}

function exitHandler(){
  console.log("closing db connection")
  client.close(true)
  process.exit(1)

}

async function run() {
      // Connect the client to the server (optional starting in v4.7)
      await client.connect();
      // Establish and verify connection
      await client.db("admin").command({ ping: 1 });
      console.log("Connected successfully to server");

  }
run().catch(console.dir);

 export async function validateUser(username:string,password:string):Promise<[number,string]>{
    let database = client.db("vue-chat")
    const users = database.collection("users")
    const query = {username:username}
    const user = await users.findOne(query)
    console.log("validate result:",user);

    //if doesn't, return non-exist
    if(user==null){
      return [AuthResult.NonExist,""];
    }
    //compare password 
    if(password == user.password){
      return [AuthResult.Success,user._id.toString()];
    }
    else{
      return [AuthResult.WrongPassword,""];
    }

  }

  export async function createUser(username:string,password:string){
    let database = client.db("vue-chat")
    const users = database.collection("users")
    //user id 

    const record = {
      username:username,
      password:password
    }
    const result = await users.insertOne(record)
    return result
  }


  export async function findAllUsers(){
    const database = client.db("vue-chat");
    const users = database.collection("users")
    const query = {}
    const options = {
      projection:{_id:1,username:1}
    }
    try{
      const cursor = users.find(query,options)
      return cursor.toArray();
  
    }
    catch{
      return Promise.resolve("error happened")
    }
  }

  //write a message to the db 
 export async function storeMessage(msg:Uint8Array){
  let stringMsg = decoder.decode(msg);
  let parsed = stringMsg.split(";");
  console.log("parsed msg",parsed)
  let sender = parsed[0];
  let recv = parsed[1];
  let message = parsed.slice(2).join("");
  const database = client.db("vue-chat");
  const chat = database.collection("chat-history");
  const doc = {
    send:sender,
    recv:recv,
    message:message
  }
  const result = await chat.insertOne(doc)
  if(!result.acknowledged){
    console.log("store chat message failed")
  };
}
  //clean up 
  process.on("SIGINT",exitHandler)
  process.on("uncaughtException",(err,origin)=>{
    console.log(err)
    exitHandler()
  })  
