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
const findLike=asyncHandler(async function(req,res,targetType) {
    const {id: targetId}=req.params
    const userId=req.user?._id

    
 if(!mongoose.Types.ObjectId.isValid(targetId)){
        throw new ApiError(400,"Id is not matching to fetch Any comment")
    }


    let Liked;
    if(userId){
        Liked=await Like.aggregate([
            {
              $match:{
                targetId:new mongoose.Types.ObjectId(targetId),
                targetType,
              }   
            },
            {
                $group:{
                    _id:null,
                    //means all match document comes to this group
                    totalLikes:{$sum:1},
                    likedByuser:{
                        $sum:{
                            $cond:[
                             {$eq:["$likedBy", new mongoose.Types.ObjectId(userId)]},
                              1,
                              0
                            ]
                        }
                    }

                }
            }
        ])
    }else{
        Liked=await Like.aggregate([
            {
              $match:{
                targetId:new mongoose.Types.ObjectId(targetId),
                targetType,
              }   
            },
            {
               $count: "totalLikes"
            }
        ])

    }
    if(!Liked){
        throw new ApiError(400,"liked Not found")
    }

    
    const totalLikes=Liked[0]?.totalLikes || 0
    const isliked=Liked[0]?.likedByuser || 0

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
               totalLikes,
               isliked
            },
            "fteched successfully"

        )
    )


})

//Get Likes For Video
export const getLikeForVideo=asyncHandler(async function(req,res) {
    await findLike(req,res,"Video")
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
