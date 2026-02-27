import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  getUserProfile,
  updateUserProfile,
} from "./user.controller";

const router = Router();

router.get("/profile", authenticate, getUserProfile);
router.put("/profile", authenticate, updateUserProfile);

export default router;