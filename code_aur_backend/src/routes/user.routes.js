import { Router } from 'express'
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage
} from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { veriFyJwt } from '../middlewares/auth.middleware.js'

const router = Router()

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
)
router.route("/login").post(loginUser);
//secure route
router.route("/logout").post(veriFyJwt, logOutUser);
router.route("/refresh-tokent").post(refreshAccessToken);
router.route("/change-password").post(veriFyJwt, changeCurrentPassword);
router.route("/current-user").get(veriFyJwt, getCurrentUser);
router.route("/update-account").patch(veriFyJwt, updateAccountDetails);
router.route("/avatar").patch(veriFyJwt, upload.single("avatar"), updateAvatar);
router.route("/cover-image").patch(veriFyJwt, upload.single("coverImage"), updateCoverImage);
router.route("/c/:username").get(veriFyJwt, getUserChannelProfile);
router.route("/watch-history").get(veriFyJwt, getWatchHistory);


export { router }