import { Router } from "express";
import { getAllTutors, getAllEnrollments, getEnrollmentById } from "./admin.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { getAllCourses } from "../courses/course.controller";
import { ReportController } from "../reports/report.controller";

const adminRoutes = Router();

adminRoutes.get("/Users", authenticate, getAllTutors);
adminRoutes.get("/courses", authenticate, getAllCourses);
adminRoutes.get("/enrollments", authenticate, getAllEnrollments);
adminRoutes.get("/enrollments/:id", authenticate, getEnrollmentById);

// Admin Reporting APIs
adminRoutes.get("/reports/courses", authenticate, ReportController.getAdminCourseReports);
adminRoutes.get("/reports/reviews", authenticate, ReportController.getAdminReviewReports);
adminRoutes.patch("/reports/:id", authenticate, ReportController.updateReportStatus);

export default adminRoutes;