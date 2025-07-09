import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const veriFyJwt = asyncHandler( async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    if(!token){
      throw new ApiError(401, "UnAuthorized Request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
  
    if(!user){
      //comming this part after some time
      throw new ApiError(401, "Invalid access Token");
    }
    req.user = user;
    next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access token")
  }
})