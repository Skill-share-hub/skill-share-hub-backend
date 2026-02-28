import { Router } from 'express';

import { validate } from '../../middlewares/validate.middleware';
import { refresh, register } from './auth.controller';
import { validateRegisterInput } from './auth.validation';

const authRouter = Router();

authRouter.post('/register', validate(validateRegisterInput), register);
authRouter.post('/refresh', refresh);

export default authRouter;