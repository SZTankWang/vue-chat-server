import jwt from "jsonwebtoken"

const secretkey = "mysecret"
//a function to sign jwt 
export function signJWT(payload:object):string{
    const token = jwt.sign(payload,secretkey)
    return token
}


//a function to verify jwt 
export function verifyJWT(token:string):Object|undefined{
    try{
        const decoded = jwt.verify(token,secretkey)
        console.log(decoded)
        return decoded
    }catch(err){
        console.log("invalid token")
        return undefined 
    }
}
