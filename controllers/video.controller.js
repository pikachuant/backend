import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudiNary ,minioClient} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import ffmpeg from "fluent-ffmpeg"
import fs from "fs"


function getUrlID(url){
  try {
    const finalId=url.split("/backend/")[1]
    return finalId
  } catch (error) {
    throw null
  }
}

//Upload Video
export const videoUploader=asyncHandler(async function(req,res) {
    const videoFile=req.files?.videoFile?.[0]
    const thumbnail=req.files?.thumbnail?.[0]
  
    const {titile,description}=req.body

    const id=req.user?._id
    
    if(!id){
        throw new ApiError(400,"user is not authenticated to upload video")
    }

    const getVideoMetadata=async function (file) {
        const metadata=await new Promise((resolve,reject)=>{
            ffmpeg.ffprobe(file,(err,data)=>{
                if (err) reject(err)
                else resolve(data)
            })
        })
        return metadata.format.duration
    }
    
    
    const duration=await getVideoMetadata(videoFile.path)
    const uploadVideoFile= await uploadOnCloudiNary(videoFile)
    const uploadthumbnail= await uploadOnCloudiNary(thumbnail)
    console.log(duration);
    

    if(!uploadVideoFile && !uploadthumbnail){
       throw new ApiError(400,"Something happened during upload")
    }
    

    const videoUploadResponse=await Video.create({
        videoFile:uploadVideoFile,
        thumbnail:uploadthumbnail,
        owner:id,
        titile,
        description,
        duration
    })
    
    if (!videoUploadResponse) {
        throw new ApiError(400,"Somthing went wrong during Database Storing")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            "200",
            videoUploadResponse,
            "Uploaded Sucessfully"
        )
    )

})

//Get User all Uploaded Video Details
export const allVideosDetails=asyncHandler(async function (req,res) {
    const id=req.user?._id

    if(!id){
        throw new ApiError(400,"User is not Authenticated")
    }
    
    const getVideos=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"videos"
            }
        },
        {
            $project:{
                password: 0,
                __v: 0
            }
        }

    ])
    
    console.log(getVideos)

    if(!getVideos){
        throw new ApiResponse("200","User Don't have any videos")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            "200",
            getVideos[0].videos,
            "ALL video details are fetched succesfully"
        )
    )

})

//Delete Video
export const deleteVideo=asyncHandler(async function(req,res) {
    const id=req.user?._id
    const videoId=req.body?._id

    
    
    if (!id || !videoId ) {
        throw new ApiError(400,"user is not authneticated to Do the Task")
    }
    
    
    const Response=await Video.findOne(
        {
            _id:videoId,
            owner:id
        }
    )
    if(!Response){
        throw new ApiError(400,"User is not authenticated")
    }
  

    const thumbnailID=getUrlID(Response.thumbnail)
    const videoFileID=getUrlID(Response.videoFile)
    console.log(thumbnailID);
    console.log(videoFileID);
    


    try {
        const resofVideo=await minioClient.removeObject( "backend",thumbnailID)
        const resofthumbNail=await minioClient.removeObject( "backend",videoFileID)
    } catch (error) {
        throw new ApiError(400,"Deleteion failed at cloudinary")
    }

    const Success=await Response.deleteOne();

    if(!Success){
        throw new ApiError(400,"Video Deletion failed")
    }


    return res
    .status(200)
    .json(
        new ApiResponse(
            "200",
            "Video Deleted SuccessFully"
        )
    )
})

//Edit VideoData But not Video
export const editVideo=asyncHandler(async function (req,res) {
    const {id}=req.params

    const {titile,description,isPublished}=req.body
    const thumbnailLocalPath=req.file?.path

    if (!titile && !description && !thumbnailLocalPath && isPublished===undefined) {
        throw new ApiError(400,"Must need to Change something")
    }

    if(!id){
        throw new ApiError(400,"User must select a video Update")
    }

    let filePath;
    if (thumbnailLocalPath) {
        filePath=await uploadOnCloudiNary(thumbnailLocalPath)
    }

    const video=await Video.findById(
        id
    )

    if(!video){
        throw new ApiError(400,"Video Not Found to edit or Some issue happnened")
    }

    const oldThumbNail=video.thumbnail

    try {
        if(titile) video.titile=titile
        if(description) video.description=description
        if(filePath) video.thumbnail=filePath.url
        if(isPublished !==undefined) video.isPublished=isPublished
        await video.save()

        if(filePath && oldThumbNail){
        await cloudinary.uploader.destroy(getUrlID(oldThumbNail), {
           resource_type: "image"
        });
    }
    } catch (error) {
        throw new ApiError(400,error)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            "200",
            "Edit Successfully Done"
        )
    )
})

//Get random Video for Feeds
export const getFeedVideos=asyncHandler(async function (req,res) {
    const videos=await Video.aggregate(
        [
            {
                $match:{
                    isPublished: true
                }
            },
            {
                $sample:{
                    size:10
                }
            }
        ]
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "Video fecthed Successfully"
        )
    )
})

//Views Count
export const addViews=asyncHandler(async function (req,res) {
    const videoId=req.body?._id

    const addedViews=await video.findByIdAndUpdate(
        videoId,
        {
            $inc:{
                views:1
            },
        },
        {
            new:true
        }
    )

    if(!addedViews){
        throw new ApiError(404,"Video is not Found || Views Count is not Done")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            addedViews,
            "Views Added Successfully"
        )
    )
})

