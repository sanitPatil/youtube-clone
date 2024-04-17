const asyncHandler = (requestHandler)=>{ 
    return(
        (req,res,next)=>{
            Promise
            .resolve(requestHandler(req,res,next))
            .catch((err)=>next(err))
        }
    )
}



export {asyncHandler} // HIGHER ORDER FUNCTION WHO TAKES PARAMETER AS FUNCTION AND RETURNS A FUNCTION 
/* USING TRY AND CATCH */
// const asyncHandler = (fn)=>async (req,res,next)=>{
//     try{
//         await fn(req,res,next)
//     }catch(err){
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }

// export {asyncHandler}