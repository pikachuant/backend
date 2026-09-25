import mongoose,{Schema} from "mongoose";

const commentSchema=new Schema({
    comment:{
        type:String,
        required:true
    },
    targetId:{
        type:mongoose.Schema.Types.ObjectId,
        refPath:"targetType",
        required:true
    },
    targetType:{
        type:String,
        required:true,
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