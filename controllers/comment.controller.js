import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

//DO Comment On Video And Tweet
export const doComment=asyncHandler(async function(req,res) {
    const userId=req.user?._id

    if (!userId) {
        throw new ApiError(401,"User is not authenticated")
    }

    let {comment,targetId,targetType,parentId}=req.body
    
    parentId = parentId || null

    console.log("parentId",parentId)

    if(!comment || !targetId || !targetType){
        throw new ApiError(400,"user must need to Provide ALL Stuff to get comment")
    }

    if(!mongoose.Types.ObjectId.isValid(targetId)){
        throw new ApiError(400,"Please pass a Valid targetId")
    }

    if(parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
        throw new ApiError(400,"Please pass a Valid parrentId")
    }


    const response=await Comment.create(
        {
            comment,
            owner:userId,
            targetId,
            targetType,
            parentId
        }
    )

    if(parentId){
        const response=await Comment.findByIdAndUpdate(
            parentId,
            {
                $inc:{totalReplies:1}
            }
        )
        if(!response){
            throw new ApiError(500,"Something went wrong during updating the totalReplies")
        }
    }


    if(!response){
        throw new ApiError(500,"Somethig went wrong during posting the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            "200",
            response,
            "Comment Done"
        )
    )

})

//Update Comment
export const updateComment=asyncHandler(async function(req,res) {
    const userId = req.user?._id;
    if(!userId){
        throw new ApiError(401,"User is not authenticated")
    }
    const {id,comment}=req.body
    

    if(!id || !comment){
        throw new ApiError(400,"User is not Authenticated to Do that")
    }
    
    const existingComment=await Comment.findById(id)
    
    if(!existingComment){
        throw new ApiError(400,"Comment not Found to Edit")
    }


    if(existingComment.owner.toString()!==userId.toString()){
        throw new ApiError(400,"You are not authenticated to do the Update")
    }

    if(existingComment.comment.trim()==comment){
        throw new ApiError(400,"If you wants to update the comment please update with new thoght now with same Comment")
    }


    const response=await Comment.findByIdAndUpdate(
        id,
        {
            comment
        },
        { returnDocument: "after", runValidators: true }
    )

    if(!response){
        throw new ApiError(500,"Something went wrong during update the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            response,
            "Comment Updated Succesfully"
        )
    )
})

//Delete Comment
export const deleteComment=asyncHandler(async function (req,res) {
    const userId=req.user?._id
    const{commentId}=req.body

   if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

   if (!commentId) {
       throw new ApiError(400, "Comment ID is required");
    }

    const response=await Comment.findOneAndDelete(
        {
            _id:commentId,
            owner:userId
        }
    )

    if(!response){
        throw new ApiError(400,"Not authorized or comment not found")
    }

    if(response.parentId){
        const updateParent=await Comment.findByIdAndUpdate(
            response.parentId,
            {
                $inc:{totalReplies:-1}                  
            }
        )
        if(!updateParent){
            throw new ApiError(500,"Something went wrong during updating the totalReplies")
        }
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Comment Deleted Successfully"
        )
    )
    
})

//Function for Fetch Comment on Pagination of limit 10
const findoutComment=async function(req,res,targetType) {
    const {targetId}=req.params
    const {cursor}=req.query
    //send the last comment createdAt time soo from the basis of last comment date
    const userId=req.user?._id
    
    let Limit=11
    //After "?" we can send any query
    
    if(!mongoose.Types.ObjectId.isValid(targetId)){
        throw new ApiError(400,"Id is not matching to fetch Any comment")
    }

    let query={
        targetId,
        targetType
    }

    if(cursor){
        query._id={$lt:new mongoose.Types.ObjectId(cursor)}
        //less than id because new id > old id
    }

    const Allcomment=await Comment.find(query)
    .sort({_id: -1 })
    //will sort greater first small last soo newest comment first oldest last
    .limit(Limit)

    if(!Allcomment){
        throw new ApiError(400,"Comemnt not Found")
    }
    const hasMore=Allcomment.length>10;
    const comments=Allcomment.slice(0,10)

    let commentEditable=comments.map((comment)=>{
       let obj=comment.toObject()
       obj.isEditable= userId && userId.toString()===obj.owner.toString()
       return obj
    })

    const nextCursor=comments.length>0?comments[comments.length-1]._id:null

    return res.
    status(200)
    .json(
        new ApiResponse(
            200,
            {
                comments:commentEditable,
                nextCursor,
                hasMore
            },
            "Fetched Succesfully"
        )
    )

}

const findoutCommentReply=async function(req,res,targetType){
    const {parrentId,cursor}=req.body
    const userId=req.user?._id
    const limit=11

    if(!mongoose.Types.ObjectId.isValid(parrentId)){
        throw new ApiError(400,"Id is not matching to fetch Any comment")
    }

    const userObjectId=userId?new mongoose.Types.ObjectId(userId):null

    const match={
        parrentId
    }

    if(cursor){
        match._id={$lt:new mongoose.Types.ObjectId(cursor)}
    }


    const response=await Comment.aggregate([
        {
            $match:match
        },
        {
            $sort:{_id:-1}
        },
        {
            $limit:limit
        },
        {
            $addFields:{
                isEditable:userObjectId?{
                    $eq:["$owner", userObjectId]
                }:false
            }
        },
        {
            $lookup:{
                from:"comments",
                let:{
                    replyId:"$_id"
                },
                pipeline:[
                    {
                        $match:{
                            $expr:{
                                $eq:["$parrentId","$$replyId"]
                            }
                        }
                        
                    },
                    {
                        $sort:{_id:-1}
                    },
                    {
                        $addFields:{
                            isEditable:userObjectId?{
                                $eq:["$owner",userObjectId]
                            }:false
                        }
                    }
                ],
                as:"replies"
            }
            

        }
    ])

    const hasMore=response.length>10
    const comments=response.slice(0,10)
    const nextCursor=comments.length>0?comments[comments.length-1]._id:null     

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {
            comments,
            nextCursor,
            hasMore
        },
        "Fetched Succesfully"
    )) 
}

//Find Comment For Video with the help of upper fucntion
export const findCommentForVideo=asyncHandler(async function (req,res) {
    await findoutComment(req,res,"Video")
})

//Find Comment For Tweet with the help of upper fucntion
export const findCommentForTweet=asyncHandler(async function (req,res) {
    await findoutComment(req,res,"Tweet")
})

export const findCommentReplyForVideo=asyncHandler(async function(req,res) {
    await findoutCommentReply(req,res,"Video")
})

export const findCommentReplyForTweet=asyncHandler(async function(req,res) {
    await findoutCommentReply(req,res,"Tweet")
})  