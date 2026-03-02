import { Router } from 'express';

import { validate } from '../../middlewares/validate.middleware';
import { login, refresh, register, sendOtp } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validation';

const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login', validate(loginSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/send-otp', sendOtp);

export default authRouter;