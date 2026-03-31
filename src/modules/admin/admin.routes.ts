import { Router } from "express";
import { getAllTutors, getAllEnrollments, getEnrollmentById } from "./admin.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { getAllCourses } from "../courses/course.controller";
const adminRoutes = Router();
adminRoutes.get("/Users", authenticate, getAllTutors);
adminRoutes.get("/courses", authenticate, getAllCourses);
adminRoutes.get("/enrollments", authenticate, getAllEnrollments);
adminRoutes.get("/enrollments/:id", authenticate, getEnrollmentById);

// router.get("/tutors/:id/profile", authenticate, getTutorProfile);
// router.get("/tutors/:id/courses", authenticate, getTutorCourses);
// router.get("/tutors/:id/analytics", authenticate, getTutorAnalytics);
export default adminRoutes;