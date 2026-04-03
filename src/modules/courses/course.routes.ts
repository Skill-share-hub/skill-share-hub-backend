import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';

import { ContentSchema, CourseSchema, UpdateCourseSchema, UpdateStatusSchema } from './course.validation';
import { changeCourseStatus, createCourse, getAllCourses, getSingleCourse, updateCourse, deleteCourse, getTutorCourses, createContent, updateContent, deleteContent, getCourseCategories, toggleBlockCourse } from './course.controller';
import { ReviewController } from '../reviews/review.controller';
import { upload } from '../../utils/multer';
import { removeCourse } from './course.service';

const router = Router();

router.get('/', getAllCourses);

router.get('/tutor',
  authenticate,
  authorizeRoles("tutor", "premiumTutor","student"),
  getTutorCourses
);
router.get("/categories", getCourseCategories);

router.get('/:id', getSingleCourse);

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
router.patch("/:id/block", toggleBlockCourse);

// Review routes
router.post('/review',
  authenticate,
  authorizeRoles("student"),
  ReviewController.createReview
);

router.get('/:id/reviews',
  ReviewController.getCourseReviews
);

router.get('/my-review/:id',
  authenticate,
  ReviewController.getUserReview
);

router.put('/review/:id',
  authenticate,
  authorizeRoles("student"),
  ReviewController.updateReview
);

router.delete('/review/:id',
  authenticate,
  authorizeRoles("student"),
  ReviewController.deleteReview
);

export default router ;

