import { Router } from 'express';

import { validate } from '../../middlewares/validate.middleware';
import { login, refresh, register } from './auth.controller';
import { validateLoginInput, validateRegisterInput } from './auth.validation';
import { googleLogin } from './auth.controller';

const authRouter = Router();

authRouter.post('/register', validate(validateRegisterInput), register);
authRouter.post('/login', validate(validateLoginInput), login);
authRouter.post('/refresh', refresh);
authRouter.post('/google', googleLogin);

export default authRouter;