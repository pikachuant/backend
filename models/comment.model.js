import mongoose,{Schema} from "mongoose";

const commentSchema=new Schema({
    comment:{
        type:String,
        required:true
    },
    targetId:{
        type:mongoose.Schema.Types.ObjectId,
        refPath:"targetType"
    },
    targetType:{
        type:String,
        enum:["Video","Tweet"]
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    parentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment",
        default: null
    },
    totalReplies:{
        type:Number,
    }
},{timestamps:true})

export const Comment=mongoose.model("Comment",commentSchema)