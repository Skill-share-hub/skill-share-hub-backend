import { Router } from 'express';

import { validate } from '../../middlewares/validate.middleware';
import { refresh, register, sendOtp } from './auth.controller';
import { registerSchema } from './auth.validation';

const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/refresh', refresh);
authRouter.post('/send-otp', sendOtp);

export default authRouter;