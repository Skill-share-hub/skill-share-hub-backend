import {Router} from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { getMyEnrollments, getEnrollmentById, markContent , getQuizController , getSummaryController } from './enrollment.controller';

const router = Router();

router.get('/',authenticate,getMyEnrollments);

router.get('/:id',authenticate,getEnrollmentById);

router.get('/quiz/:id',authenticate,getQuizController);

router.get('/summary/:id',authenticate,getSummaryController);

router.patch('/:id/mark',authenticate,markContent);


export default router ;