import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudiNary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import fs from "fs"
import jwt from "jsonwebtoken";
import mongoose from "mongoose"
 
  //Generate Access And Generate Refresh-Token
  const generateAccessAndGenerateRefresh=async function (user) {
    try {
        const accessToken=user.generateAcessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({ValidateBeforeSave:false})

        return {accessToken,refreshToken}
    } catch (error) {
    console.error("🔥 FULL ERROR:", error);
    throw error;
  }
  }

  //Register User
  const registerUser=asyncHandler( async function(req,res){
    //get user details from frontend
    //validation-not empty
    //check user is not alredy registered or not
    //check for image avatar/cover image
    //upload them to cloudinary
    //create user object-create entry in db
    //removed password and refresh token from response
    //check for user creation
    //return response

    const {username,email,fullName,password}=req.body
      //Destructure the req.body 

      const avatarLocalPath = req.files?.avatar?.[0]
      const coverImageLocalPath=req.files?.coverImage?.[0]

      //checked file have proper data or not
      if([fullName,email,username,password]
         .some((field)=>field.trim()==="")){
         throw new ApiError(400,"All feild Should be Filled")
        }
    
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       if(!emailRegex.test(email)){
         throw new ApiError(400,"Email is Not valid")
        }
      //check the user is already regsuter or not
      const existedUser=await User.findOne({
         $or:[{ username },{ email }]
        })


      //For File Removal method when user failed to register safe side is when path is not avail;
       const safeUnlink=async function(path){
         if(path){
            await fs.promises.unlink(path)
         }
        }
     //

      if(existedUser){
          await Promise.all([
             safeUnlink(avatarLocalPath.path),
             safeUnlink(coverImageLocalPath.path)

           ])
         throw new ApiError(409,"User is already regsitered with email or username")
        }

 //File chhecking
    
    //Due to we are using middleware soo multer can give us extra data by files
    //Due to multiple file we cna use body but due to middleware we can direct access by files
    
    if(!avatarLocalPath.path){
        throw new ApiError(400,"Avatar Image must need")
    }

    const avatar_url=await uploadOnCloudiNary(avatarLocalPath)
    const coverImage_url=await uploadOnCloudiNary(coverImageLocalPath)
    

    if(!avatar_url){
        throw new ApiError(400,"Avatar is Required")
    }
 //Create user
    const user=await User.create({
        fullName,
        avatar:avatar_url,
        coverImage:coverImage_url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    
    
    
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something Went wrong while creating user")
    }

  //response
   return res
   .status(201)
   .json(
     new ApiResponse(200,createdUser,"User Created Successfully")
   )
  })
 
  //Login User
  const loginUser=asyncHandler(async function(req,res){
     //Get data from user.req
     //check all files ae not empty
     //findout user by email/if not send user not found by email
     //check password
     //if checked create refresh and access token
     //send responsed user logeed in with access token by cookies
     const {email,username,password}=req.body
     
     if (!(email || username) ) {
        throw new ApiError(400,"Username or email must need")
     }
     if (!password) {
        throw new ApiError(400,"Password must need")
     }
     
     
     const existedUser=await User.findOne({
        $or:[{ username },{ email }]
     })

     if (!existedUser) {
        throw new ApiError(400,"User is not register with us/Please check username/email again")
     }

     const isPasswordCorrect=await existedUser.isPasswordCorrect(password)
     
     if (!isPasswordCorrect) {
        throw new ApiError(400,"Password is not correct")
     }

     
     const {accessToken,refreshToken}=await generateAccessAndGenerateRefresh(existedUser)

   
     const userObj = existedUser.toObject();
     delete userObj.password;

     //said that it's only editable by server not by front but can be visible in frontend
     const options={
        httpOnly:true,
        scure: "true"
     }

     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
        new ApiResponse(200,
         {
            user:userObj,
            accessToken,
            refreshToken,
         },
         "user Loggedin Succesfully"
        )
      )
    
   })
   
  //Logout User
  const logoutUser=asyncHandler(async function (req,res) {
      const id=req.user?._id
      
      //Database se refresh token hatao
      await User.findByIdAndUpdate(
         //this method direct find user by id and then update feild in the user
         //$set-what need to set
         //new:true-said that next request will be give you new value 
         //nehni toh purana refresh token mil ajeyga uska faida nehni
         id,
         {
            $unset:{
               refreshToken:""
               //it can be ""/1 unset just need key:value but value will be just ignore soo only key will removed
               //then value ignore why not only key because our motive to rmeove the key soo value will auto remove
               //No due to javascript shorthand|
               //Bottom line
               // MongoDB → doesn’t care about value
               // JavaScript → requires key:value format unless shorthand resolves properly and need varibale but variable not defined
            }
         },
         {
            returnDocument: 'after'
            //means return the new updated full object after update that's why
         }
      )

      const options={
        httpOnly:true,
        secure: "true"
     }

      //Now cookie se bhi hatao
      return res
      .status(200)
      .clearCookie("refreshToken",options)
      .clearCookie("accessToken",options)
      .json(
         new ApiResponse(
            200,
            {},
            "User Logout Successfully"
         )
      )
   })
  
  //Assign New Access Token
  const assignAccessToken=asyncHandler(async function(req,res){
   try {
      const getrefreshToken=req.cookies.refreshToken || req.header("Authorization")?.replace("Bearer ","")
      
      if (!getrefreshToken) {
         throw new ApiError(401,"User is not Authenticated")
      }
      
      let decodedToken
      try {
         decodedToken=jwt.verify(getrefreshToken,process.env.REFRESH_TOKEN_SECRET)
      } catch (error) {
         throw new ApiError(400,"Invalid Refresh Token")
      }
   
      const user=await User.findById(decodedToken?._id).select("-password")
   
   
      if (getrefreshToken!==user?.refreshToken) {
         throw new ApiError(400,"user is not authenticated")
      }
   
      const {accessToken,refreshToken}=await generateAccessAndGenerateRefresh(user)
   
      await User.findByIdAndUpdate(
         user._id,
         {
            $set:{
               refreshToken
            }
         },
         {
            returnDocument: 'after'
         }
      )
   
      const options={
           httpOnly:true,
           secure: "true"
        }
   
      return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(
         new ApiResponse(
            200,
            {
               accessToken,
               refreshToken
            },
            "Access Token Reassigned"
         )
      )
   } catch (error) {
      throw new ApiError(400,error?.message || "Inavlid refresh token")
   }

   })
  
  //Update Account Details
   const updateAccountDetails=asyncHandler(async function(req,res) {
      const {fullName,email}=req.body;

      if (!(email || fullName)) {
         throw new ApiError(400,"Email and username must Be filled to Update")
      }
      
      let user;
      try {
          user=await User.findByIdAndUpdate(
            req.user?._id,
            {
               $set:{
                  fullName,
                  //if it undefined nothing will updated soo don't worry about null update it just ignore
                  email
                  //due to unique in schema if another user email provied it will not update give warning in code 11000
                  //if same email is provide which is laready have it just update
                  //recomend check in frontend to save db call cost
               }
            },
            { new: true }
         )
         .select("-password")
   
      } catch (error) {
         if (error.code===11000) {
            throw new ApiError(400,"User is Belongs to Another Account")
         }else{
            throw new ApiError(400,"Somethign went wrong")
         }
      }
   
      return res.status(200)
      .json(
         new ApiResponse(201,user,"Details Updated Successfully")
      )
   })

  //Update Password
  const updatePassword=asyncHandler(async function (req,res) {
   const {oldPassword,newPassword,confPassword}=req.body

   if (oldPassword && newPassword && confPassword) {
      if(oldPassword===newPassword){
         throw new ApiError(400,"New password Should be Differnet fro old password")
      }
      
      if (newPassword !== confPassword ) {
         throw new ApiError(400,"New password and Confirmation password must be same")
      }
   }else{
      throw new ApiError(400,"All feild Must be filled")
   }

   const user=await User.findById(req.user?._id)

   const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

   if (!isPasswordCorrect) {
      throw new ApiError(400,"You must Give your current password correct")
   }
   
   user.password=newPassword
   //
   await user.save({validateBeforeSave:false})
   
   return res
   .status(200)
   .json(
      200,
      "Password Updated Succesfully"
   )


  })

  //Update AvatrImage File
  const updateAvatarImage=asyncHandler(async function (req,res) {
    
    const localFilePath=req.file?.path

   
    if (!localFilePath) {
      throw new ApiError(400,"File must need to change")
    }

    const response=await uploadOnCloudiNary(localFilePath)

    if (!response.url) {
      throw new ApiError(500,"Somethign wrong during upload on cloudinary")
    }
    
    
    
    const user=await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar:response.url
         }
      },
      {returnDocument: "after"}
    ).select("-password")

    return res
    .status(200)
    .json(
      201,
      user,
      "Avatar Image Updated Succesfully"
    )

  })

  //Update CoverImage File
  const updateCoverImage=asyncHandler(async function (req,res) {
    const localFilePath=req.file?.path
    if (!localFilePath) {
      throw new ApiError(400,"File must need to change")
    }

    const response=await uploadOnCloudiNary(localFilePath)

    if (!response.url) {
      throw new ApiError(500,"Somethign wrong during upload on cloudinary")
    }

    const user=await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            coverImage:response.url
         }
      },
      {returnDocument: "after"}
    ).select("-password")

    return res
    .status(200)
    .json({
       success: true,
       user,
       message: "Cover Image Updated Successfully"
    })

  })

  //Get Current user
  const getCurrentUser=asyncHandler(async function(req,res) {
   return res
   .status(200)
   .json(new ApiResponse(
      200,
      req.user,
      "User Fetched Sucessfully"
   ))
  })

  //Get Subscribe and Subscription Details
  const subsciprtionDetails=asyncHandler(async function (req,res) {
   const {username}=req.params

   if(!username?.trim()){
      throw new ApiError(400,"Username Not found")
   }

   const channel=await User.aggregate([
      {
         $match:{
            username:username?.trim()
         }
      },
      {  //Findout How many Subscribers Do You have
         $lookup:{
            //$lookup = match + fetch related documents from another collection
            // Match values (localField == foreignField)
            // Bring full documents from the "from" collection
            
            from:"subscriptions",
            //because you have to findout the user deails in Subscriptions model you expoerted
            //why subscriptions =>because mongoDb store in lowercase and extra "s" on last
            
            localField:"_id",
            //localField = field from the CURRENT document whose value will be used for matching
            //What id is this it's joining User._id to foregin feild ID which will be given in 3rd
            
            foreignField:"channel",
            //foreignField always belongs to the from collection here subscription
            //we are checking how much time my User_id==channel
            
            as:"subscribers"
            //Result will named as subscribers it's a array
         }
      },
      {  //FIndout How many channel/which is user you subscribedTo
         $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            //Checking Subscred with user id
            as:"subscribedTo"
         }
      },
      {
         $addFields:{
            subscribersCount:{
               $size:"$subscribers"
               //Dut to output is Array soowe can count Size
            },
            channelSubscribedTo:{
               $size:"$subscribedTo"
            },
            isSubscribed:{
               $cond:{
                  if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                  //cond-condition i am chchinng
                  //if condition
                  //in menas the user or the first paramter is in the seond one it rather array/object
                  //req.user?._id it comes from verifyJWT due to you are loggedin soo you send cookies
                  then:true,
                  //if success and found then then sending true yes you are in the list of subscribers
                  else:false
                  //if not send false that means Frontend engineer will show "Subscribe" not subscribed
               }
            }
         }
      },
      {
         $project:{
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelSubscribedTo: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
         }
         //Here i am sending this thing from output to use
         //you can send createdAt to show when the channel is created
      }
   ])

   if (!channel?.length) {
      throw new ApiError(400,"Channel not Found or some error occured")
   }

   return res
   .status(200)
   .json(
      new ApiResponse(
         200,
         channel[0],
         "fecthed successfully"
      )
   )
  })

  //Get Watch History 
  const getWatchHistory=asyncHandler(async function(req,res) {
   const id=req.user?._id
   if (!id) {
      throw new ApiError(400,"user is not Authenticated")
   }

   const watchHistory=await User.aggregate([
      {
         $match:{
            _id:new mongoose.Types.ObjectId(id)
         }
      },
      {
         $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
               {
                  $lookup:{
                     from:"users",
                     localField:"owner",
                     foreignField:"_id",
                     as:"ownerdetails",
                     pipeline:[
                        {
                           $project:{
                              fullName:1,
                              username:1,
                              avatar:1
                           }
                        }
                     ]
                  }
               }
            ]
         }
      }
   ])

   return res
   .status(200)
   .json(
      new ApiResponse(
         "200",
         watchHistory[0].watchHistory,
         "Wtach History fecthed Successfully"
      )
   )
  

 })


export {getWatchHistory,subsciprtionDetails,getCurrentUser,registerUser,loginUser,logoutUser,assignAccessToken,updateAccountDetails,updatePassword,updateAvatarImage,updateCoverImage}