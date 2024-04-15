import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME ,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localfilepath)=>{
    try{
        if(!localfilepath) return null;
        const response =await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto"
        });
        console.log(`File uploaded successfully :${response.url}`);
        fs.unlinkSync(localfilepath);
        return response;
    }catch(err){
        fs.unlinkSync(localfilepath); // REMOVE THE LOCALLY SAVE FILE FROM SERVER AS OPERATION GOT FIALED 

        console.log(`file upload unsuccessfull!!! ${err}`);
        return null;
    }
}

export {uploadOnCloudinary}

