//require('dotenv').config({path:'./.env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";
dotenv.config({
    path:'./.env'
})

const PORT = process.env.PORT || 8000;

connectDB()
.then(()=>{
    app.on("Error",()=>{
        console.log(`APP FAILED!!! TERMINATING PROJECT.`);
        process.exit(1);
    })
    app.listen(PORT, ()=>{
        console.log(`RUNNING SUCCESSFULLY ON PORT ${PORT}`);
    })

})
.catch((err)=>{
    console.log(`MONGODB CONN FAILED!!! ${err}`);
})



/*
// console.log(`${DB_NAME}`);
(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("Error",(err)=>{
            console.log(`encounter error while connecting with DB!!!`);
            throw err;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`Listeing on PORT ${process.env.PORT}`);
        })

    }catch(err){
        console.log(err);
    }
})()


*/