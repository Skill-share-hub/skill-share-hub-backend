import { Router } from 'express';

import authRouter from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import courseRoutes from './modules/courses/course.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import tutorRoutes from "./modules/tutors/tutor.routes";
const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillShareHub backend is running'
  });
});

router.use('/auth', authRouter);
router.use('/users', userRoutes);
router.use('/courses',courseRoutes);
router.use('/dashboard',dashboardRouter)
router.use("/tutor", tutorRoutes);
export default router;