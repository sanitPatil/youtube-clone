import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const userSchema = new Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true  // OPTIMIZE SEARCHING BUT SOME OVERHEAD
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, // CLOUDINARY URI
        required:true
    },
    coverImage:{
        type:String,
    },
    password:{
        type:String,
        required:[true,"password is required!"],
    },
    refreshToken:{
        type:String,
    },
    watchHistory:[
        {
        type:Schema.Types.ObjectId,
        ref:"Video"
        }
    ]
},{timestamps:true});

userSchema.pre("save", async function(next){ // middleware
    if(!this.isModified("password")) next(); // only when password field is changed
    
    this.password =await bcrypt.hash(this.password,10) // field and rounds 
    next();
})

// USER METHODS 
userSchema.methods.isPasswordCorrect = async function(password){
     //console.log(password)
     return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){ // NO NEED FOR ASYNC AS IT FASTER WORK
    return jwt.sign({
        _id:this._id,
        userName:this.userName,
        email:this.email,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY 
    }
)
}


userSchema.methods.generateRefreshToken = function(){ // NO NEED FOR ASYNC AS IT FASTER WORK
    return jwt.sign({ 
        _id:this._id,  // THIS IS PAYLOAD - PAYLOAD NOTHING BUT DATA
    },
    process.env.REFRESH_TOKEN_SECRET, // REFRESH TOKEN SECRET 
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY // EXPIRY
    }
)
}



export const User = mongoose.model("User",userSchema)

