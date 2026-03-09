import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { getStudentDashboard, getTuterDashboard } from "./dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.get("/student", authenticate, getStudentDashboard);

dashboardRouter.get("/tutor", authenticate, getTuterDashboard);

export default dashboardRouter;