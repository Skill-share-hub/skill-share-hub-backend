import express from "express";
import {
  getNotifications,
  markAsReadController,
  markAllAsReadController,
} from "./notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = express.Router();

router.get("/",authenticate, getNotifications);
router.patch("/:id/read",authenticate, markAsReadController);
router.patch("/mark-all-read",authenticate, markAllAsReadController);    
 
export default router;