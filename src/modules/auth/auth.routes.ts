import { Router } from 'express';

import { validate } from '../../middlewares/validate.middleware';
import { googleLogin } from './auth.controller';
import { login, refresh, register, sendOtp, forgotPassword, resetPassword } from './auth.controller';
import {forgotPasswordSchema,loginSchema,otpSchema,registerSchema,resetPasswordSchema} from './validators/index'

const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login', validate(loginSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/google', googleLogin);
authRouter.post('/send-otp', validate(otpSchema), sendOtp);
authRouter.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', validate(resetPasswordSchema), resetPassword);



export default authRouter;