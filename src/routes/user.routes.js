import {Router} from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
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




export default router;