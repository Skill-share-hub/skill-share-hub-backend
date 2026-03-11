import { Course } from "../courses/course.model";

export const getTutorCoursesService = async (
  tutorId: string,
  page: number,
  limit: number
) => {

  const skip = (page - 1) * limit;

  const courses = await Course.find({ tutorId })
    .skip(skip)
    .limit(limit)
    .select("title category status createdAt");

  const result = courses.map(course => ({
    ...course.toObject(),
    enrollmentsCount: 0
  }));

  return result;
};