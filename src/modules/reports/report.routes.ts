import { Router } from "express";
import { ReportController } from "./report.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const reportRoutes = Router();

// User Reporting APIs
reportRoutes.post("/course", authenticate, ReportController.createCourseReport);
reportRoutes.post("/review", authenticate, ReportController.createReviewReport);

reportRoutes.get("/course/:courseId/check", authenticate, ReportController.checkCourseReport);
reportRoutes.get("/review/:reviewId/check", authenticate, ReportController.checkReviewReport);

export default reportRoutes;
