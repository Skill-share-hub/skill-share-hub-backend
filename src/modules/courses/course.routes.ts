import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { CourseSchema, UpdateCourseSchema, UpdateStatusSchema } from './course.validation';
import { changeCourseStatus, createCourse, getAllCourses, getSingleCourse, updateCourse } from './course.controller';
import { upload } from '../../utils/multer';

const router = Router();

router.get('/', getAllCourses);

router.get('/:id', getSingleCourse)

router.post('/',
  authenticate,
  authorizeRoles("tutor", "premiumTutor","student"),
  upload.single("thumbnailUrl"),
  validate(CourseSchema),
  createCourse
)

router.put('/:id',
  authenticate,
  authorizeRoles("tutor", "premiumTutor","student"),
  upload.single("thumbnailUrl"),
  validate(UpdateCourseSchema),
  updateCourse
)

router.patch('/:id',
  authenticate,
  authorizeRoles("tutor", "premiumTutor","student"),
  validate(UpdateStatusSchema),
  changeCourseStatus
);


export default router ;