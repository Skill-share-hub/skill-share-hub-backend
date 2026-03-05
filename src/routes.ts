import { Router } from 'express';

import authRouter from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import courseRoutes from './modules/courses/course.routes';

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

export default router;