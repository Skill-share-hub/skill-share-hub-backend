import { Request, Response, NextFunction } from "express";

type Roles = "student" | "tutor" | "premiumTutor" | "admin"

export const authorizeRoles = (...roles: Roles[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient role",
      });
    }

    next();
  };
};