import { Request, Response, NextFunction } from "express";
import { checkToken } from "../utils/checkToken";

interface JwtPayload {
  userId: string;
  role: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
   const token = req.cookies.accessToken;
   if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token missing",
      });
    }
    
    const user = await checkToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};
