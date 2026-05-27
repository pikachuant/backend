import mongoose from "mongoose";


const ConnectDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}?authSource=admin`)
        console.log(`\n MongoDb connection success ${connectionInstance}`)
        console.log(`\n MongoDb connection success ${connectionInstance.connection.host}`)
        console.log("Server started");

    } catch (error) {
        console.log("Database Connection Failed",error)
        process.exit(1)
    }
}

export default ConnectDB