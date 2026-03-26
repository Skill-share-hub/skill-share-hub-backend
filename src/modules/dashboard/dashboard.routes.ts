import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { getStudentDashboard, getTutorDashboard , getAdminDashboard } from "./dashboard.controller";
import { authorizeRoles } from "../../middlewares/role.middleware";

const dashboardRouter = Router();

dashboardRouter.get("/student", authenticate, getStudentDashboard);

dashboardRouter.get("/tutor", authenticate, getTutorDashboard);

dashboardRouter.get("/admin",authenticate , authorizeRoles("admin") , getAdminDashboard  )

export default dashboardRouter;