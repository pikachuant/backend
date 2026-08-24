import "./env.js"
import ConnectDB from "./connectdb.js";
import {app} from "./app.js"



//  import dns from "node:dns/promises"
//  dns.setServers(["1.1.1.1", "8.8.8.8"])

ConnectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
     console.log(`Backend is running at port:${process.env.PORT}`);
    })
})
.catch((err)=>{
  console.log("Error is Detected At Database Connection",err)
})

