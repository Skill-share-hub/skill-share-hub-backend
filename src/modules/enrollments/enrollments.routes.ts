import {Router} from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { getMyEnrollments, getEnrollmentById } from './enrollment.controller';

const router = Router();

router.get('/',authenticate,getMyEnrollments);

router.get('/:id',authenticate,getEnrollmentById);


export default router ;