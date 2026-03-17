import {Router} from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { getMyEnrollments, getEnrollmentById, markContent } from './enrollment.controller';

const router = Router();

router.get('/',authenticate,getMyEnrollments);

router.get('/:id',authenticate,getEnrollmentById);

router.patch('/:id/mark',authenticate,markContent);


export default router ;