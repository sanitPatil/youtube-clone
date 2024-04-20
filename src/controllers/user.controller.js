import { asyncHandler } from "../utils/asyncHandler.js";
import  { ApiError } from "../utils/ApiError.js";
import  { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import mongoose from "mongoose";
const generateAccessAndRefreshTokens = async (userId) =>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,`Something Went Wrong While Generating Access and Refresh Tokens`);
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })

    // const {fullName} = req.body;
    // console.log(fullName);

    const {fullName,email,userName, password} = req.body;
    if([fullName,email,userName,password].some((fields)=> fields.trim() === "")){
        throw new ApiError(400,"ALL FIELDS REQUIRED!!!");
    }

    const existedUser = await User.findOne({
        $or:[{ userName }, { email }]
    });

    if(existedUser){
        throw new ApiError(409,"USER WITH EMAIL AND USERNAME ALREADY EXISTS!!!");
    }

    const avatarLocalPath = req.files?.avatar[0].path;
    const coverImagePath = req.files?.coverImage[0].path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required!!!");
    }

    // refresh token save 
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImagePath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required!!!");
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage.url,
        email,
        password,
        userName:userName.toLowerCase(),
        
    });
    

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering user");
    }
   
    return res.status(201).json(new ApiResponse(200,createdUser, "user created successfully."))
})

const loginUser = asyncHandler(async (req,res)=>{
    
    // req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const {email,userName,password} = req.body;

    if(!(userName && email)){ // to choose any one of them  !(userName && email)
        throw new ApiError(400,"username and email is required!!!");
    }

    const user = await User.findOne({
        $or: [{userName}, {email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exists!!!");
    }

    const isPassowrdValid = await user.isPasswordCorrect(password);

    if(!isPassowrdValid){
        throw new ApiError(401,"Password is invalid!!!");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly:true,
        secure:true
    }


    return res
           .status(200)
           .cookie("accessToken",accessToken,options)
           .cookie("refreshToken",refreshToken,options)
           .json(
            new ApiResponse(200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "user logged in successfully..."
        )
           )

})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // {this will unset the particular field}           undefinedwork fine
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out."))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        //console.log(incomingRefreshToken);
        if(!incomingRefreshToken){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
        console.log(decodedToken);
        const user = await User.findById(decodedToken?._id);
        //console.log(user);
        if(!user){
            throw new ApiError(401,"invalid request")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired")
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        const options = {
            httpOnly:true,
            secure:true
        }
       // console.log(accessToken,"||",newRefreshToken);
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"accesstoken refreshed...")
        )
    } catch (error) {
        throw new ApiError(400,error?.mesage|| "Invalid refresh token")
    }
})

const changedPassword = asyncHandler(async (req,res)=>{

    const {oldPassword,newPassword} = req.body;
    //console.log(oldPassword,newPassword)
    const user = await User.findById(req.user?._id);
    //console.log(user);
    
    const isPasswordCorrect = await user.isPasswordCorrect(String(oldPassword))
    // console.log(isPassowrdCorrect);
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invaalid Old Password!");
    }

    user.password = String(newPassword);
    await user.save({validateBeforeSave: false});

    return res
            .status(200)
            .json(new ApiResponse(200,{},`Password changed Successfully.`))
})


const getCurentUser = asyncHandler(async (req,res)=>{
    const user = req.user;
    if(!user){
        throw new ApiError(404,"User Not Found!")
    }
    res.status(200).json(new ApiResponse(200,user,"success"))
})


const upldateAccountDetails = asyncHandler(async (req,res)=>{
    
    const {fullName,email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400,"All Fields Are Required!")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                fullName,
                email:email
                }
        },
        {new:true} // RETURN UPDATED RESPONSE OR RESULT
    ).select("-password -refreshTpken")
    return res
        .status(200)
        .json(new ApiResponse(200,user,"Account details Successfully updated."))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path; // REQ.FILE => SINGLE FILE AND REQ.FILES => MULTIPLE AS WE USE IN REGISTERD USER

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }
    // WRITE ERROR WITH SPECIFIC AS IT CAN HELP TO GET LOCATION THE CURRENT ERROR OCCURED.

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        throw new ApiError(500,"Error while uploading avatar user");
    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
    {
        $set:{
            avatar:avatar.url
        }
    },
    {new:true}
    ).select("-password -refreshToken")

    deleteOnCloudinary(avatar.url);
    return res.status(new ApiResponse(200,user,"Avatar updated successfully."))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path; // REQ.FILE => SINGLE FILE AND REQ.FILES => MULTIPLE AS WE USE IN REGISTERD USER

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover-Image file is missing");
    }
    // WRITE ERROR WITH SPECIFIC AS IT CAN HELP TO GET LOCATION THE CURRENT ERROR OCCURED.

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage){
        throw new ApiError(500,"Error while uploading user cover-Image");
    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
    {
        $set:{
            coverImage:coverImage.url
        }
    },
    {new:true}
    ).select("-password -refreshToken")

    deleteOnCloudinary(coverImage.url)
    return res.status(new ApiResponse(200,user,"Cover-Image updated successfully."))
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate(
        [
            {
                $match:{
                    userName:username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from:"subscriptions", // model subscription as we know mongodb himsle as s and make lowercase
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribeTo"
                }
            },
            {
                $addFields:{
                    subscribercount:{
                        $size:"$subscribers",
                    },
                    channelSubscribeToCount:{
                        $size:"$subscribeTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                            then:true,
                            else:false,
                        }
                    }
                }
            },
            {
                $project:{
                    fullName:1,
                    userName:1,
                    subscribercount:1,
                    channelSubscribeToCount:1,
                    isSubscribed:1,
                    avatar:1,
                    coverImage:1,
                    email:1
                }
            }
            
        ]
    )

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"user channel fetch successfully."))
})


const getWatchHistory = asyncHandler(async (req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory", // need for change if
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from :"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        userName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },{
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"successfully fetch watch history"))
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changedPassword,
    getCurentUser,
    upldateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

}