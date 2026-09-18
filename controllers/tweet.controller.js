import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Tweet} from "../models/tweet.model.js"
import mongoose from "mongoose";

export const createTweet=asyncHandler(async function(req,res) {
    const userId=req.user?._id
    const {content}=req.body

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!content || content.trim() === "") {
       throw new ApiError(400, "Content is required");
    }

    const response=await Tweet.create({
        content:content.trim(),
        tweetBy:userId
    })

    if(!response){
        throw new ApiError(500,"Tweet is not Created please try again")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        response,
        "tweet created succesfully"
    ))

})

export const editTweet=asyncHandler(async function(req,res) {
    const userId=req.user?._id
    const {content}=req.body
    const {id:tweetId}=req.params  

    console.log(userId,content,tweetId)
    

    if(!userId){
        throw new ApiError(400,"user is not authenticated Do the edit")
    }

    if (!content || content.trim() === "") {
       throw new ApiError(400, "Content is required");
    }

    const tweet=await Tweet.findById(tweetId)
    

    if(!tweet){
        throw new ApiError(400,"tweet Is not Found")
    }

    if(tweet.tweetBy.toString() !==userId.toString()){
        throw new ApiError(400,"You are not Authorized to edit this tweet")
    }

    if(tweet.content==content){
        throw new ApiError(401,"For Edit Please send new edited Tweet not the same Content")
    }

    
    tweet.content=content.trim()
    const updatedTweet=await tweet.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            201,
            updatedTweet,
            "Tweet updated Succesfully"
        )
    )


})

export const deleteTweet=asyncHandler(async function(req,res) {
    const userId=req.user?._id
    const {tweetId}=req.params

    if(!userId){
        throw new ApiError(400,"User is not Authenticated to Do that")
    }

    if(!tweetId){
        throw new ApiError(400,"CommentId Must need to Delete tweet")
    }

    const Deleted=await Tweet.findOneAndDelete(
        {
            _id:tweetId,
            tweetBy:userId
        }
    )

    if(!Deleted){
        throw new ApiError(400,"User is not Authenticate to Do the Delete or Comment Not Found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Comment deleted Successfully"
        )
    )


})

export const fetchAllTweets=asyncHandler(async function(req,res) {
    const userId=req.user?._id
    const {cursor}=req.query
    
    let query={}

    if(cursor){
        query._id={$lt:new mongoose.Types.ObjectId(cursor)}
    }

    const allTweets=await Tweet.find(query)
    .sort({ _id: -1 })
    .limit(11)
    .lean()

    // if(!allTweets){
    //     throw new ApiError(400,"Some Issue arises during tweet fetch")
    // }
    //it will send [] if no tweets are there soo it will be never matched
    const hasMore = allTweets.length > 10;
    const tweets = allTweets.slice(0, 10);
    

    const Editable=tweets.map(tweet=>({
        ...tweet,
        isEditable:userId && tweet.tweetBy.toString()==userId
    }))
    

    const nextCursor=Editable.length>0?Editable[Editable.length-1]._id.toString():null

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                Editable,
                hasMore,
                cursor:nextCursor
            },
            "All tweet Fetched SucessFully"
        )
    )

})

