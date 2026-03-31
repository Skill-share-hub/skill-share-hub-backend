import { ApiError } from "../../utils/ApiError";
import { Course } from "../courses/course.model";
import { User } from "../users/user.model";
import { Enrollment } from "../enrollments/enrollment.model";
import { Types } from "mongoose";

export const getAllTutorsService = async (query: any) => {
  const { search, status, isPremium,role, page = 1, limit = 10 } = query;

  const skip = (Number(page) - 1) * Number(limit);

  const pipeline: any[] = [];

  // Atlas Search
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
        ]
      }
    }
  });
}
  // Filters
 pipeline.push({
  $match: {
    ...(role && role !== "all" && { role }),
    ...(status && { status }),
    ...(isPremium !== undefined && isPremium !== "" && {
      isPremium: isPremium === "true"
    })
  }
});

  //  Count (before pagination)
  const countPipeline = [...pipeline, { $count: "total" }];
  const countResult = await User.aggregate(countPipeline);
  const totalCount = countResult[0]?.total || 0;

  //  Pagination
  pipeline.push(
    { $skip: skip },
    { $limit: Number(limit) }
  );

  //  Final data
  const tutors = await User.aggregate(pipeline);

  return {
    tutors,
    totalCount,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit))
  };
};

export const getAllEnrollmentsService = async (query: any) => {
  const { search, status, page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const pipeline: any[] = [];

  // Initial Match for status
  if (status && status !== "all") {
    pipeline.push({ $match: { status } });
  }

  // Lookup Student
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "student"
    }
  });
  pipeline.push({ $unwind: { path: "$student", preserveNullAndEmptyArrays: true } });

  // Lookup Course to get tutorId
  pipeline.push({
    $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "course"
    }
  });
  pipeline.push({ $unwind: { path: "$course", preserveNullAndEmptyArrays: true } });

  // Lookup Tutor
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "course.tutorId",
      foreignField: "_id",
      as: "tutor"
    }
  });
  pipeline.push({ $unwind: { path: "$tutor", preserveNullAndEmptyArrays: true } });

  // Search Filter
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { "student.name": { $regex: search, $options: "i" } },
          { "courseSnapshot.title": { $regex: search, $options: "i" } }
        ]
      }
    });
  }

  // Final Projection
  pipeline.push({
    $project: {
      _id: 1,
      student: {
        _id: { $ifNull: ["$student._id", null] },
        name: { $ifNull: ["$student.name", "Unknown User"] },
        email: { $ifNull: ["$student.email", ""] }
      },
      course: {
        _id: "$courseId",
        title: "$courseSnapshot.title",
        thumbnail: "$courseSnapshot.thumbnail",
        price: "$courseSnapshot.price",
        creditCost: "$courseSnapshot.creditCost",
        courseType: "$courseSnapshot.courseType"
      },
      tutor: {
        _id: { $ifNull: ["$tutor._id", null] },
        name: { $ifNull: ["$tutor.name", "Unknown Tutor"] }
      },
      status: 1,
      progress: 1,
      enrolledAt: 1
    }
  });

  // Sort by enrollment date
  pipeline.push({ $sort: { enrolledAt: -1 } });

  // Pagination with $facet
  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [{ $skip: skip }, { $limit: Number(limit) }]
    }
  });

  const [result] = await Enrollment.aggregate(pipeline);
  const totalCount = result.metadata[0]?.total || 0;
  const enrollments = result.data;

  return {
    enrollments,
    totalCount,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit))
  };
};

export const getEnrollmentByIdService = async (id: string) => {
  const pipeline: any[] = [
    { $match: { _id: new Types.ObjectId(id) } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "courses",
        localField: "courseId",
        foreignField: "_id",
        as: "courseInfo"
      }
    },
    { $unwind: { path: "$courseInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "courseInfo.tutorId",
        foreignField: "_id",
        as: "tutor"
      }
    },
    { $unwind: { path: "$tutor", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        student: {
          _id: "$student._id",
          name: { $ifNull: ["$student.name", "Unknown User"] },
          email: { $ifNull: ["$student.email", ""] }
        },
        course: {
          _id: "$courseId",
          title: "$courseSnapshot.title",
          thumbnail: "$courseSnapshot.thumbnail",
          price: "$courseSnapshot.price",
          creditCost: "$courseSnapshot.creditCost",
          courseType: "$courseSnapshot.courseType"
        },
        tutor: {
          _id: "$tutor._id",
          name: { $ifNull: ["$tutor.name", "Unknown Tutor"] }
        },
        status: 1,
        progress: 1,
        totalContents: 1,
        completedContent: 1,
        enrolledAt: 1
      }
    }
  ];

  const [enrollment] = await Enrollment.aggregate(pipeline);
  if (!enrollment) throw new ApiError(404, "Enrollment not found");

  return enrollment;
};

//profile
export const getTutorProfileService = async (id: string) => {
  const tutor = await User.findById(id).lean();

  if (!tutor) throw new ApiError(404, "Tutor not found");

  return tutor;
};

//courses
export const getTutorCoursesService = async (id: string) => {
  const courses = await Course.find({ tutorId: id }).lean();

  return courses;
};

//analysing
export const getTutorAnalyticsService = async (id: string) => {
  const courses = await Course.find({ tutorId: id });

  if (!courses) return {
    totalCourses: 0,
    totalEnrollments: 0,
    totalHours: 0,
    avgRating: 0,
    totalEarnings: 0
  };

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
    (courses.length || 1);

  // 💰 Earnings (BASED ON YOUR MODEL)
  const totalEarnings = courses.reduce((acc, c) => {
    // paid course
    if (c.courseType === "paid") {
      return acc + (c.price || 0) * (c.totalEnrollments || 0);
    }

    // credit course (optional logic)
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