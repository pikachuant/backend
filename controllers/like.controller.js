import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";
//Do Like
export const doLike=asyncHandler(async function(req,res) {
    const userId=req.user?._id

    if(!userId){
        throw new ApiError(400,"User is not authenticated to Do the Task")
    }

    const {id,targetType}=req.body


    if(!id || !targetType){
        throw new ApiError(400,"Something went wrong please Do like Aagain")
    }
    

    const findDuplicate=await Like.findOne(
        {
         targetId: id,
         targetType: targetType,
         likedBy: userId
        } 
    )
    
    let message;

    if(findDuplicate){
       await Like.findOneAndDelete(
            {
              targetId: id,
              targetType: targetType,
              likedBy: userId
            }
        )
         message="Unlike Done"
    }
    else{
        const like=await Like.create(
            {
              targetId: id,
              targetType: targetType,
              likedBy: userId
            }
        )
         message="like Done"
    }

    return res
    .status(200)
    .json(new ApiResponse(
        "200",
        message
    ))

})

//Unlike Button
export const unLike=asyncHandler(async function(req,res) {
    const userId=req.user?._id

    if(!userId){
        throw new ApiError(401,"User is not authenticated to Do the Task")
    }

    const {id,targetType}=req.body
    
    if(!id || !targetType){
        throw new ApiError(400,"Something went wrong please Do like Aagain")
    }

    const response=await Like.findOneAndDelete(
            {
              targetId: id,
              targetType,
              likedBy: userId
            }
    )

    if(!response){
        throw new ApiError(404,"Like Refrence not found")
    }
   
    return res
    .status(200)
    .json(
        new ApiResponse(
            "200",
            response,
            "Unlike Done"
        )
    )


})

//Find All Like on Any Video or Tweet
const findLike = async function(req, targetType) {

    const { id: targetId } = req.params
    const userId = req.user?._id

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
        throw new ApiError(400, "Invalid target ID")
    }

    const match = {
        targetId: new mongoose.Types.ObjectId(targetId),
        targetType
    }

    const pipeline = [
        {
            $match: match
        },
        {
            $group: {
                _id: null,

                totalLikes: {
                    $sum: 1
                },

                likedByUser: userId
                    ? {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$likedBy",
                                        new mongoose.Types.ObjectId(userId)
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                    : {
                        $sum: 0
                    }
            }
        }
    ]

    const liked = await Like.aggregate(pipeline)

    return {
        totalLikes: liked[0]?.totalLikes || 0,
        isLiked: (liked[0]?.likedByUser || 0) > 0
    }
}

//Get Likes For Video
export const getLikeForVideo = asyncHandler(async function(req, res) {

    const data = await findLike(req, "Video")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                data,
                "Fetched successfully"
            )
        )
})

//Get Likes For Tweet
export const getLikeForTweet=asyncHandler(async function(req,res) {
    // return findLike(req,res,"Tweet")
    //why not return because Findlike is alaso returnting to response
    await findLike(req,res,"Tweet")

})

//Get Likes For Comment
export const getLikeForComment=asyncHandler(async function(req,res) {
    await findLike(req,res,"Comment")
})
