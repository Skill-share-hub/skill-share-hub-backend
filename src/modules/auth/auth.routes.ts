import { Router } from 'express';

import { validate } from '../../middlewares/validate.middleware';
import { googleLogin } from './auth.controller';
import { login, logout, refresh, register, sendOtp, forgotPassword, resetPassword } from './auth.controller';
import { forgotPasswordSchema } from './validators/forgotPasswordSchema';
import { loginSchema } from './validators/loginSchema';
import { otpSchema } from './validators/otpSchema';
import { registerSchema } from './validators/registerSchema';
import { resetPasswordSchema } from './validators/resetPasswordSchema';

import { authenticate } from '../../middlewares/auth.middleware';
import { authLimiter, otpLimiter } from '../../middlewares/rateLimitting.middleware';

const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login',authLimiter, validate(loginSchema), login);
authRouter.post('/logout', authenticate, logout);
authRouter.post('/refresh', refresh);
authRouter.post('/google', googleLogin);
authRouter.post('/send-otp',otpLimiter, validate(otpSchema), sendOtp);
authRouter.post('/forgot-password',otpLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password',otpLimiter, validate(resetPasswordSchema), resetPassword);



export default authRouter;