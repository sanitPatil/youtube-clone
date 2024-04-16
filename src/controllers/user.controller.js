import { asyncHandler } from "../utils/asyncHandler.js";
import  { ApiError } from "../utils/ApiError.js";
import  { ApiResponse } from "../utils/ApiResponse.js";

import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";

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
        userName:userName.toLowerCase()
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

    const isPassowrdValid = await user.isPassowrdCorrect(password);

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
           .cookie("AccessToken",accessToken,options)
           .cookie("RefreshToken",refreshToken,options)
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
            $set: {
                refreshToken:undefined
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
export {
    registerUser,
    loginUser,
    logoutUser
}