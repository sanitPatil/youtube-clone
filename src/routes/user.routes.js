import {Router} from "express";
import { loginUser,
    logoutUser, 
    refreshAccessToken, 
    registerUser,
    changedPassword,
    getCurentUser,
    upldateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../controllers/auth.middleware.js";
const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser)


router.route('/login').post(loginUser)

// secure section 
router.route('/logout').post(verifyJWT,logoutUser) // BEACUASE verifyJWT returns user so it will available in next function
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT,changedPassword)
router.route('/current-user').get(verifyJWT,getCurentUser)
router.route('/update-account').patch(verifyJWT,upldateAccountDetails)
router.route('/avatar').patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route('/cover-image').patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route('/c/:username').get(verifyJWT,getUserChannelProfile)
router.route('/history').get(verifyJWT,getWatchHistory)



export default router;