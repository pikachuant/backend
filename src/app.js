import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"


const app=express()

app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials:true //allow to acess Sessions,cookies,header
    }
))

app.use(express.json( {limit:"20kb"}))
//express to accept json
app.use(express.urlencoded({extended:true,limit:"20kb"}))
//extended-nested object
app.use(express.static("public"))
//public is a folder
app.use(cookieParser())


//routes
import userRouter from "../routes/user.routes.js"

//routers
app.use("/v1/api/user",userRouter)

//Error Handler 
app.use((err, req, res, next) => {
    return res
    .status(err.statuscode)
    .json({
        success: false,
        message: err.message
    });
});

export {app}

// When app.js runs, Express registers all middleware and routes,
// creating an internal middleware/route chain (a map).
// For every incoming request, Express follows that chain,
// finds the matching route, executes the middleware and controller,
// and finally sends the appropriate response.