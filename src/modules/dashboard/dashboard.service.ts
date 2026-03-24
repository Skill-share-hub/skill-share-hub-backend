import { Enrollment } from "../enrollments/enrollment.model";
import { User } from "../users/user.model";
import { ApiError } from "../../utils/ApiError";
import { getCourse, getCourses } from "../courses/course.service";

export const getStudentDashboardData = async (userId: string) => {

   const enrollments = await Enrollment.find({ userId })
    .populate({
      path: "courseId",
      populate: {
        path: "tutorId",
        select: "_id name avatarUrl"
      }
    });

  const enrolledCourses = enrollments.map(e => e.courseId);
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
    creditBalance
  };
};