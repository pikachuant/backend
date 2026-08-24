import { Router } from "express";
import { assignAccessToken, getCurrentUser, getWatchHistory, loginUser, logoutUser, registerUser, subsciprtionDetails, updateAccountDetails, updateAvatarImage, updateCoverImage, updatePassword } from "../controllers/user.registercontroller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/jwt.middleware.js";
import { addViews, allVideosDetails, deleteVideo, editVideo, findVideoByName, getFeedVideos, videoUploader } from "../controllers/video.controller.js";
import { doLike, getLikeForComment, getLikeForTweet, getLikeForVideo, unLike } from "../controllers/like.controller.js";
import {optionalVerfiyJwt} from "../middlewares/optional.middleware.js"
import {deleteComment, doComment, findCommentForTweet, findCommentForVideo, updateComment} from "../controllers/comment.controller.js"
import {createTweet, deleteTweet, editTweet, fetchAllTweets} from "../controllers/tweet.controller.js"
import {addnewItemtoPlayList, createPlayList, findPlayList, removeItemFromPlaylist, removePlaylist} from "../controllers/playlist.controller.js"


const router=Router()
//User Controller
  router.route("/register").post(
    //injected middleware because files are two or more soo fields
    //it need array with all details of object
    
    upload.fields([
        {name:"avatar",
         maxCount:1
        },
        {name:"coverImage",
         maxCount:1 
        }
    ]),
    registerUser)

  router.route("/login").post(
    loginUser
  )

  router.route("/refresh-token").post(
    assignAccessToken
  )

  router.route("/logout").post(
    verifyJWT,
    logoutUser
  )

  router.route("/change-avatar").post(
    upload.single("avatar"),
    verifyJWT,
    updateAvatarImage
  )

  router.route("/update-account-details").post(
    verifyJWT,
    updateAccountDetails
  )

  router.route("/update-password").post(
    verifyJWT,
    updatePassword
  )

  router.route("/change-coverimage").post(
    upload.single("coverImage"),
    verifyJWT,
    updateCoverImage
  )

  router.route("/getuser").post(
    verifyJWT,
    getCurrentUser
  )

  router.route("/channel/:username").get(
    verifyJWT,
    subsciprtionDetails
  )
  
  router.route("/user/watch-history").get(
    verifyJWT,
    getWatchHistory
  )
  
  //Video Route
  router.route("/videoupload").post(
    verifyJWT,
    upload.fields(
      [
        {
          name:"videoFile",
          maxCount:1
        },
        {
          name:"thumbnail",
          maxCount:1
        }
      ]
    ),
    videoUploader
  )

  router.route("/getvideo").get(
    verifyJWT,
    allVideosDetails
  )
  
  router.route("/removevideo").delete(
    verifyJWT,
    deleteVideo
  )

  router.route("/update/:id").get(
    upload.single("thumbnail"),
    editVideo
  )

  router.route("/get-feed-videos").get(
    getFeedVideos
  )

  router.route("/addviews").post(
    addViews
  )

  router.route("/search/:query").get(
    findVideoByName
  )

  //PlayList Controller
  router.route("/user/create-playlist").post(
    verifyJWT,
    createPlayList
  )

  router.route("/user/playlists").get(
    verifyJWT,
    findPlayList
  )

  router.route("/user/playlist/addvideo").post(
    verifyJWT,
    addnewItemtoPlayList
  )

  router.route("/user/playlist/removeitem").delete(
    verifyJWT,
    removeItemFromPlaylist
  )

  router.route("/user/playlist/removeplaylist/:playlistId").delete(
    verifyJWT,
    removePlaylist
  )

  router.route("/user/playlist/allplaylist").get(
    verifyJWT,
    findPlayList
  )


 
  //Like Route
  router.route("/user/like").post(
    verifyJWT,
    doLike
  )

  router.route("/user/unlike").delete(
    verifyJWT,
    unLike
  )

  router.route("/user/video/:id/get-alllikes").get(
    optionalVerfiyJwt,
    getLikeForVideo
  )

  router.route("/user/tweet/:id/get-alllikes").get(
    optionalVerfiyJwt,
    getLikeForTweet
  )

  router.route("/user/comment/:id/get-alllikes").get(
    optionalVerfiyJwt,
    getLikeForComment
  )


  //Comment Route
  router.route("/user/comment").post(
    verifyJWT,
    doComment
  )

  router.route("/user/comment/update").post(
    verifyJWT,
    updateComment
  )

  router.route("/user/comment/deletecomment").delete(
    verifyJWT,
    deleteComment
  )

  router.route("/user/video/comment/:targetId").get(
    optionalVerfiyJwt,
    findCommentForVideo
  )

  router.route("/user/tweet/comment/:targetId").get(
    optionalVerfiyJwt,
    findCommentForTweet
  )

  //Tweets Routes
  router.route("/user/tweet/create-tweet").post(
    verifyJWT,
    createTweet
  )

  router.route("/user/tweet/:id/edit-tweet").post(
    verifyJWT,
    editTweet
  )

  router.route("/user/tweet/delete/:tweetId").delete(
    verifyJWT,
    deleteTweet
  )

  router.route("/user/tweet/all-tweet").get(
    optionalVerfiyJwt,
    fetchAllTweets
  )



export default router;
