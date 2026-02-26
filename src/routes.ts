import { Router } from 'express';

import authRouter from './modules/auth';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillShareHub backend is running'
  });
});

router.use('/auth', authRouter);

export default router;