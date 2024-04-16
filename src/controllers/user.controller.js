import { asyncHandler } from "../utils/asyncHandler.js";
import  { ApiError } from "../utils/ApiError.js";
import  { ApiResponse } from "../utils/ApiResponse.js";

import {User} from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";


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

    const existedUser = User.findOne({
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

export {registerUser}