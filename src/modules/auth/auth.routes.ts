import { Router } from 'express';

import { validate } from '../../middlewares/validate.middleware';
import { register } from './auth.controller';
import { validateRegisterInput } from './auth.validation';

const authRouter = Router();

authRouter.post('/register', validate(validateRegisterInput), register);

export default authRouter;