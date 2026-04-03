import { Router } from 'express';

import authRouter from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import courseRoutes from './modules/courses/course.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import tutorRoutes from "./modules/tutors/tutor.routes";
import walletRoutes from './modules/wallet/wallet.routes';
import paymentRoutes from './modules/payments/routes/payment.routes';
import enrollmentRoutes from './modules/enrollments/enrollments.routes'
import adminRoutes from './modules/admin/admin.routes';
import premiumApplication  from './modules/premiumTutor/premiumApplication.routes';
import chatbotRouter from './modules/chatbot/chatbot.routes'
import reportRoutes from './modules/reports/report.routes';
const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillShareHub backend is running'
  });
});

router.use('/auth',authRouter);
router.use('/users', userRoutes);
router.use('/courses',courseRoutes);
router.use('/dashboard',dashboardRouter)
router.use("/tutor", tutorRoutes);
router.use('/wallet', walletRoutes);
router.use('/payments', paymentRoutes);
router.use('/enrollments',enrollmentRoutes);
router.use('/admin', adminRoutes);
router.use('/premium-application',premiumApplication);
router.use('/chatbot',chatbotRouter);
router.use('/reports', reportRoutes);

export default router;