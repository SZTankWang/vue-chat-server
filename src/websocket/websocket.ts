import WebSocket,{WebSocketServer} from "ws"
import util from "node:util"

const decoder = new util.TextDecoder();
//create a websocket server 
export function createWS(){
    console.log("creating ws server")
    const wss = new WebSocketServer({
        noServer:true,
        clientTracking:true
    },()=>{
        console.log("websocket server is initialized")
    })

    return wss 
}   

export function sendMessage(msg:Uint8Array,map:Map<string,WebSocket>){
    //parse 
    let stringMsg = decoder.decode(msg)
    
    let parsed = stringMsg.split(";")
    let recv = parsed[1];
    console.log(recv)
    let recvSocket = map.get(recv);
    if(recvSocket===undefined){
        console.log("unexist recv socket")
    }
    else{
        recvSocket.send(stringMsg);
    }
}


