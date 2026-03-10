import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { getTutorCourses } from "./tutor.controller";

const router = Router();

router.get(  "/courses",  authenticate,  authorizeRoles("tutor", "premiumTutor"),  getTutorCourses
);

export default router;