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
    validate(updateUserSchema),
    updateUserProfile
);

export default router;