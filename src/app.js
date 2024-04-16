import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors({
    origin:process.env.ORIGIN,
    credentials:true,
}))

app.use(express.urlencoded({
    extended:true,
    limit:"16kb",
}))

app.use(express.json({
    limit:"16kb",
}))

app.use(express.static("public"))

app.use(cookieParser())

// USER ROUTER
import userRouter from './routes/user.routes.js'

// initilization 
app.use("/api/v1/users",userRouter); //http://localhost:5000/users/
export {app};