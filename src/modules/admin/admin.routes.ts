import { Router } from "express";
import { getAllTutors } from "./admin.controller";
import { authenticate } from "../../middlewares/auth.middleware";
const adminRoutes= Router();

adminRoutes.get("/tutors",authenticate ,getAllTutors);
// router.get("/tutors/:id/profile", authenticate, getTutorProfile);
// router.get("/tutors/:id/courses", authenticate, getTutorCourses);
// router.get("/tutors/:id/analytics", authenticate, getTutorAnalytics);
export default adminRoutes;