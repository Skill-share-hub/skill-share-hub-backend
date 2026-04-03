import { ApiError } from "../../utils/ApiError";
import { Course } from "../courses/course.model";
import { Enrollment } from "../enrollments/enrollment.model";
import { User } from "../users/user.model";

export const getAllTutorsService = async (query: any) => {
  const { search, status, isPremium, role, page = 1, limit = 10 } = query;

  const skip = (Number(page) - 1) * Number(limit);

  const pipeline: any[] = [];

  //  Atlas Search
  if (search) {
    pipeline.push({
      $search: {
        index: "tutorSearch",
        compound: {
          should: [
            {
              autocomplete: {
                query: search,
                path: "name",
                fuzzy: { maxEdits: 1 }
              }
            },
            {
              autocomplete: {
                query: search,
                path: "email",
                fuzzy: { maxEdits: 1 }
              }
            }
          ],
          minimumShouldMatch: 1
        }
      }
    });
  }

  //  Filters
  pipeline.push({
    $match: {
      role: { $ne: "admin" }, 

      ...(role === "tutor" && {
        $or: [
          { role: "tutor" },
          { role: "premiumTutor" },
          { tutorProfile: { $exists: true } } 
        ]
      }),

      ...(role === "student" && {
        role: "student"
      }),

      ...(role === "premiumTutor" && {
        role: "premiumTutor"
      }),

      ...(status && { status }),

      ...(isPremium !== undefined && isPremium !== "" && {
        isPremium: isPremium === "true"
      })
    }
  });

  const countPipeline = [...pipeline, { $count: "total" }];
  const countResult = await User.aggregate(countPipeline);
  const totalCount = countResult[0]?.total || 0;

  pipeline.push(
    { $skip: skip },
    { $limit: Number(limit) }
  );

  const tutors = await User.aggregate(pipeline);

  return {
    tutors,
    totalCount,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit))
  };
};

// ---------------- PROFILE ----------------
export const getTutorProfileService = async (id: string) => {
  const tutor = await User.findById(id).lean();

  if (!tutor) throw new ApiError(404, "Tutor not found");

  return tutor;
};

// ---------------- COURSES ----------------
export const getTutorCoursesService = async (id: string) => {
  const courses = await Course.find({ tutorId: id }).lean();
  return courses;
};

// ---------------- ANALYTICS ----------------
export const getTutorAnalyticsService = async (id: string) => {
  const courses = await Course.find({ tutorId: id });

  if (!courses || courses.length === 0) {
    return {
      totalCourses: 0,
      totalEnrollments: 0,
      totalHours: 0,
      avgRating: 0,
      totalEarnings: 0
    };
  }

  const totalCourses = courses.length;

  const totalEnrollments = courses.reduce(
    (acc, c) => acc + (c.totalEnrollments || 0),
    0
  );

  const totalHours = courses.reduce(
    (acc, c) => acc + (c.courseDuration || 0),
    0
  );

  const avgRating =
    courses.reduce((acc, c) => acc + (c.ratingsAverage || 0), 0) /
    courses.length;

  const totalEarnings = courses.reduce((acc, c) => {
    if (c.courseType === "paid") {
      return acc + (c.price || 0) * (c.totalEnrollments || 0);
    }

    if (c.courseType === "credit") {
      return acc + (c.creditCost || 0) * (c.totalEnrollments || 0);
    }

    return acc;
  }, 0);

  return {
    totalCourses,
    totalEnrollments,
    totalHours,
    avgRating: Number(avgRating.toFixed(1)),
    totalEarnings
  };
};
export const toggleBlockUserService = async (userId: string) => {
const user = await User.findById(userId).exec();

  if (!user) throw new ApiError(404, "User not found");

  user.isBlocked = !user.isBlocked; 
  await user.save();

  return user;
};

export const getUserDetailsService = async (userId: string) => {
  const user = await User.findById(userId).lean();

  if (!user) throw new ApiError(404, "User not found");

  // ---------- STUDENT ----------
  const enrollments = await Enrollment.find({ userId });

  const totalEnrolled = enrollments.length;

  // ---------- TUTOR ----------
  const courses = await Course.find({ tutorId: userId });

  const totalCourses = courses.length;

  const totalEnrollments = courses.reduce(
    (acc, c) => acc + (c.totalEnrollments || 0),
    0
  );

  const totalEarnings = courses.reduce((acc, c) => {
    if (c.courseType === "paid") {
      return acc + (c.price || 0) * (c.totalEnrollments || 0);
    }

    if (c.courseType === "credit") {
      return acc + (c.creditCost || 0) * (c.totalEnrollments || 0);
    }

    return acc;
  }, 0);

  return {
    user,

    student: {
      totalEnrolled,
      credits: user.userCreditBalance || 0
    },

    tutor: {
      totalCourses,
      totalEnrollments,
      totalEarnings
    }
  };
};