import {Router} from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { getMyEnrollments, getEnrollmentById, markContent , getQuizController , getSummaryController } from './enrollment.controller';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate,authorizeRoles("student"))

router.get('/',getMyEnrollments);

router.get('/:id',getEnrollmentById);

router.get('/quiz/:id',getQuizController);

router.get('/summary/:id',getSummaryController);

router.patch('/:id/mark',markContent);


export default router ;