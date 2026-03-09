import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { getStudentDashboard, getTutorDashboard } from "./dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.get("/student", authenticate, getStudentDashboard);

dashboardRouter.get("/tutor", authenticate, getTutorDashboard);

export default dashboardRouter;