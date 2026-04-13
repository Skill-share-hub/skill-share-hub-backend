import { Router } from "express";
import { getAllTutors, getUserDetails, toggleBlockUser } from "./admin.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { getAllCourses } from "../courses/course.controller";
import {  getAllEnrollments, getEnrollmentById } from "./admin.controller";
import { ReportController } from "../reports/report.controller";
const adminRoutes= Router();

adminRoutes.use(authenticate, authorizeRoles("admin"));

adminRoutes.get("/Users", getAllTutors);
adminRoutes.get("/courses", getAllCourses);
adminRoutes.patch("/users/:id/block", toggleBlockUser);
adminRoutes.get("/users/:id/details", getUserDetails);
adminRoutes.get("/enrollments", getAllEnrollments);
adminRoutes.get("/enrollments/:id", getEnrollmentById);
adminRoutes.get("/reports/courses", ReportController.getAdminCourseReports);
adminRoutes.get("/reports/reviews", ReportController.getAdminReviewReports);
adminRoutes.patch("/reports/:id", ReportController.updateReportStatus);

export default adminRoutes;
