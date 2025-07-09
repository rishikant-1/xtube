import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponce } from '../utils/ApiResponce.js'
import jwt from 'jsonwebtoken'




const generateAccessTokenAndRefreshTokens = async (userId) => {

  const user = await User.findById(userId)

  try {
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    //set refreshtoken in user object
    user.refreshToken = refreshToken
    
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(401, `Somsthing went wrong While generatting Access and refresh tokens ${error}`)
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, password, userName, email } = req.body

  if (
    [fullName, password, userName, email].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field must be required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "User has already registered")
  }
  const avatarLocalFilePath = req.files?.avatar[0]?.path
  // const coverImageLocalPath = req.files?.coverImage[0]?.path/
  let coverImageLocalPath;
  if (req.files && req.files.coverImage.length > 0 && Array.isArray(req.files.coverImage)) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalFilePath) {
    throw new ApiError(400, 'avatar image is required')
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  console.log(avatar);

  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    password,
    coverImage: coverImage.secure_url,
    avatar: avatar?.secure_url || "",
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if (!createdUser) {
    throw new ApiError(501, 'Something went wrong while registering the user')
  }

  return res.status(201).json(
    new ApiResponce(200, createdUser, "User register Successfully")
  )


})

const loginUser = asyncHandler(async (req, res) => {
  const { userName, password, email } = req.body;


  if (!(userName || email)) {
    throw new ApiError(400, "userName or email must be required");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }]
  });

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

  // Fetch user data without sensitive fields
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // Cookie options
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict"
  };

  // Send response with cookies and JSON
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponce(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken
        },
        "User logged in successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1  //remove this refresh token from document
      }
    },
    {
      new: true
    }
  )
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict"
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponce(200, {}, "User logout successfuly")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedAccessToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedAccessToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incommingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);
    
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponce(200, {
          accessToken,
          refreshToken
        })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});


const changeCurrentPassword = asyncHandler(async (req, res) => {

  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrected = await user.isPasswordCorrect(oldPassword);
  
  
  if (!isPasswordCorrected) {
    throw new ApiError(401, "Incorrect password")
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false })

  return res.
    status(220).
    json(
      new ApiResponce(
        200,
        {},
        "Password updated successfully"
      )
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.
    status(200).
    json(200, req.user, "user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!(fullName || email)) {
    throw new ApiError(401, "name or email are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      fullName,
      email
    },
    {
      new: true
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponce(
        200,
        user,
        "Account details updated successfully"
      )
    )
})

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalFilePath = req.file?.path;

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  if (!avatar) {
    throw new ApiError(490, "Please enter valid file path");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar.secure_url }
    },
    {
      new: true
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponce(
        200,
        user,
        "Avatar update successfully"
      )
    )
})

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalFilePath = req.file?.path;

  const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);
  if (!coverImage) {
    throw new ApiError(490, "Please enter valid file path");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverImage: coverImage.secure_url }
    },
    {
      new: true
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponce(
        200,
        user,
        "CoverImage updated successfully"
      )
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const userName = req.params;
  if (userName?.trim()) {
    throw ApiError(400, "username has missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      },
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        $channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            //in: method check can array and object
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            throw: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1
      }
    }
  ])

  if (!channel.length) {
    throw ApiError(400, "channel not exist")
  }

  return res
    .status(200)
    .json(
      new ApiResponce(
        200,
        channel[0],
        "channel fetched successfully"
      )
    )
})

const getWatchHistory = asyncHandler( async (req, res) => {
  const user = await User.aggregate([
    {
       $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
       }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  }
                },
                {
                  $addFields: {
                    owner: {
                      $first: "$owner" 
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponce(
      200,
      user[0].watchHistory,
      "watch history created successfully"
    )
  )
})

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory
}