import express from "express";
import {
  getNotifications,
  markAsReadController,
  markAllAsReadController,
} from "./notification.controller";

const router = express.Router();

router.get("/", getNotifications);
router.patch("/:id/read", markAsReadController);
router.patch("/mark-all-read", markAllAsReadController);    

export default router;