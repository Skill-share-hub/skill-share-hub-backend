import { Enrollment } from "../enrollments/enrollment.model";
import { User } from "../users/user.model";
import { ApiError } from "../../utils/ApiError";
import {  getCourses } from "../courses/course.service";

export const getStudentDashboardData = async (userId: string) => {

   const enrollments = await Enrollment.find({ userId })
  .populate({
    path: "courseId",
    populate: [
      {
        path: "tutorId",
        select: "_id name avatarUrl"
      },
      {
        path: "contentModules", 
        select: "duration"
      }
    ]
  });
let totalHours = 0;
let watchedHours = 0;
let completedHours = 0;
  const enrolledCourses = enrollments.map(e => e.courseId);
  const continueWatching = enrollments.filter(e => e.status === "active");
  enrollments.forEach((enrollment: any) => {
  const course = enrollment.courseId;

  if (!course || !course.contentModules) return;

  // total course duration
  const courseTotal = course.contentModules.reduce(
    (sum: number, content: any) => sum + (content.duration || 0),
    0
  );

  totalHours += courseTotal;

  // watched duration
  const watched = course.contentModules
    .filter((c: any) =>
      enrollment.completedContent?.includes(c._id)
    )
    .reduce((sum: number, c: any) => sum + (c.duration || 0), 0);

  watchedHours += watched;

  // completed courses
  if (enrollment.status === "completed") {
    completedHours += courseTotal;
  }
});
const recommendedData = await getCourses(
  {
    page: 1,
    limit: 4,
    recommended: true,
    minPrice: 0,
    maxPrice: 100000
  },
  userId
);

  const recommendedCourses = recommendedData.courses;
  const user = await User.findById(userId);

  if (!user) throw new ApiError(404, "User not found");

  const creditBalance = user.userCreditBalance;

  return {
  enrolledCourses,
  recommendedCourses,
  creditBalance,
  continueWatching,
  totalHours,
  watchedHours,
  completedHours
};
};