import { Router } from "express";
import { getAllTutors, getUserDetails, toggleBlockUser } from "./admin.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { getAllCourses } from "../courses/course.controller";
import {  getAllEnrollments, getEnrollmentById } from "./admin.controller";
import { ReportController } from "../reports/report.controller";
const adminRoutes= Router();
adminRoutes.get("/Users",authenticate ,getAllTutors);
adminRoutes.get(  "/courses",  authenticate, getAllCourses);
adminRoutes.patch("/users/:id/block", authenticate, toggleBlockUser);
adminRoutes.get("/users/:id/details",authenticate, getUserDetails);
adminRoutes.get("/enrollments", authenticate, getAllEnrollments);
adminRoutes.get("/enrollments/:id", authenticate, getEnrollmentById);
adminRoutes.get("/reports/courses", authenticate, ReportController.getAdminCourseReports);
adminRoutes.get("/reports/reviews", authenticate, ReportController.getAdminReviewReports);
adminRoutes.patch("/reports/:id", authenticate, ReportController.updateReportStatus);

export default adminRoutes;