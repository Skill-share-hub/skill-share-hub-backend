import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';

import { ContentSchema, CourseSchema, UpdateCourseSchema, UpdateStatusSchema } from './course.validation';
import { changeCourseStatus, createCourse, getAllCourses, getSingleCourse, updateCourse, deleteCourse, getTutorCourses, createContent, updateContent, deleteContent, getPremiumCourse, getCourseCategories } from './course.controller';
import { upload } from '../../utils/multer';

const router = Router();

router.get('/', getAllCourses);

router.get("/categories", getCourseCategories);

router.get('/:id', getSingleCourse);

router.get('/premium/:id',
  authenticate,
  getPremiumCourse
)

router.get('/tutor',
  authenticate,
  authorizeRoles("tutor", "premiumTutor"),
  getTutorCourses
);

router.post('/',
  authenticate,
  authorizeRoles("tutor", "premiumTutor"),
  upload.single("thumbnailUrl"),
  validate(CourseSchema),
  createCourse
);

router.post('/:id/content',
  authenticate,
  authorizeRoles("tutor", "premiumTutor"),
  upload.fields([
    {name : "contentUrl" , maxCount : 1},
    {name : "thumbnailUrl", maxCount : 1}
  ]),
  validate(ContentSchema),
  createContent
);

router.put('/content/:id',
  authenticate,
  authorizeRoles("tutor", "premiumTutor"),
  upload.fields([
    {name : "contentUrl" , maxCount : 1},
    {name : "thumbnailUrl", maxCount : 1}
  ]),
  validate(ContentSchema),
  updateContent
);

router.delete('/:courseId/content/:contentId',
  authenticate,
  authorizeRoles("tutor", "premiumTutor"),
  deleteContent
);

router.put('/:id',
  authenticate,
  authorizeRoles("tutor", "premiumTutor"),
  upload.single("thumbnailUrl"),
  validate(UpdateCourseSchema),
  updateCourse
);

router.patch('/:id',
  authenticate,
  authorizeRoles("tutor", "premiumTutor"),
  validate(UpdateStatusSchema),
  changeCourseStatus
);

router.delete('/:id',
  authenticate,
  authorizeRoles("tutor", "premiumTutor"),
  deleteCourse
);

export default router ;