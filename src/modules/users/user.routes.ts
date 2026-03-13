import { validate } from "../../middlewares/validate.middleware";
import { updateUserSchema } from "./user.validation";
import {
  getUserProfile,
  updateUserProfile,
} from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { Router } from "express";
import { upload } from "../../utils/multer";

const router = Router();

router.get("/profile", authenticate, getUserProfile);
router.put(
    "/profile",
    authenticate,
    upload.single("avatarUrl"),
    (req, res, next) => {
        // Parse stringified JSON fields from FormData
        if (typeof req.body.studentProfile === "string") {
            try { req.body.studentProfile = JSON.parse(req.body.studentProfile); } catch (e) {}
        }
        if (typeof req.body.tutorProfile === "string") {
            try { req.body.tutorProfile = JSON.parse(req.body.tutorProfile); } catch (e) {}
        }
        next();
    },
    validate(updateUserSchema),
    updateUserProfile
);

export default router;