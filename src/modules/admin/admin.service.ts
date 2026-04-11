import { ApiError } from "../../utils/ApiError";
import { Course } from "../courses/course.model";
import { Enrollment } from "../enrollments/enrollment.model";
import { User } from "../users/user.model";
import { Types } from "mongoose";
import { createNotification } from "../notifications/notification.service";

// ================= GET USERS =================
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

  // Filters
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

      ...(role === "student" && { role: "student" }),
      ...(role === "premiumTutor" && { role: "premiumTutor" }),

      ...(status && { status }),

      ...(isPremium !== undefined &&
        isPremium !== "" && {
        isPremium: isPremium === "true"
      })
    }
  });

  const countPipeline = [...pipeline, { $count: "total" }];
  const countResult = await User.aggregate(countPipeline);
  const totalCount = countResult[0]?.total || 0;

  pipeline.push({ $skip: skip }, { $limit: Number(limit) });

  const tutors = await User.aggregate(pipeline);

  return {
    tutors,
    totalCount,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit))
  };
};

// ================= ENROLLMENTS =================
export const getAllEnrollmentsService = async (query: any) => {
  const { search, status, page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const pipeline: any[] = [];

  if (status && status !== "all") {
    pipeline.push({ $match: { status } });
  }

  pipeline.push(
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
        as: "course"
      }
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "users",
        localField: "course.tutorId",
        foreignField: "_id",
        as: "tutor"
      }
    },
    { $unwind: { path: "$tutor", preserveNullAndEmptyArrays: true } }
  );

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

  pipeline.push(
    {
      $project: {
        _id: 1,
        student: {
          _id: "$student._id",
          name: { $ifNull: ["$student.name", "Unknown User"] },
          email: "$student.email"
        },
        course: {
          _id: "$courseId",
          title: "$courseSnapshot.title"
        },
        tutor: {
          _id: "$tutor._id",
          name: { $ifNull: ["$tutor.name", "Unknown Tutor"] }
        },
        status: 1,
        progress: 1,
        enrolledAt: 1
      }
    },
    { $sort: { enrolledAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: Number(limit) }]
      }
    }
  );

  const [result] = await Enrollment.aggregate(pipeline);

  return {
    enrollments: result.data,
    totalCount: result.metadata[0]?.total || 0,
    page,
    limit,
    totalPages: Math.ceil((result.metadata[0]?.total || 0) / limit)
  };
};


// ================= ENROLLMENT BY ID =================

export const getEnrollmentByIdService = async (id: string) => {
  const pipeline = [
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
        as: "course"
      }
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "course.tutorId",
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
          email: "$student.email",
          avatar: "$student.avatarUrl"
        },
        course: {
          _id: "$courseId",
          title: { $ifNull: ["$courseSnapshot.title", "$course.title"] },
          thumbnail: "$courseSnapshot.thumbnail",
          price: "$courseSnapshot.price",
          courseType: "$courseSnapshot.courseType"
        },
        tutor: {
          _id: "$tutor._id",
          name: { $ifNull: ["$tutor.name", "Unknown Tutor"] },
          email: "$tutor.email"
        },
        status: 1,
        progress: 1,
        enrolledAt: 1,
        totalWatchTime: 1,
        completedContent: 1,
        totalContents: 1,
        completedAt: 1
      }
    }
  ];

  const results = await Enrollment.aggregate(pipeline);
  if (!results || results.length === 0) {
    throw new ApiError(404, "Enrollment not found");
  }

  return results[0];
};

// ================= USER DETAILS =================
export const getUserDetailsService = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) throw new ApiError(404, "User not found");

  const enrollments = await Enrollment.find({ userId });
  const courses = await Course.find({ tutorId: userId });

  return {
    user,
    student: {
      totalEnrolled: enrollments.length,
      credits: user.userCreditBalance || 0
    },
    tutor: {
      totalCourses: courses.length,
      totalEnrollments: courses.reduce((a, c) => a + (c.totalEnrollments || 0), 0),
      totalEarnings: courses.reduce(
        (a, c) =>
          a +
          ((c.courseType === "paid" ? c.price : c.creditCost || 0) *
            (c.totalEnrollments || 0)),
        0
      )
    }
  };
};

// ================= BLOCK =================
export const toggleBlockUserService = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  user.isBlocked = !user.isBlocked;
  await user.save();

  await createNotification({
    userId: user._id as any,
    title: "Account Status",
    message: user.isBlocked
      ? "Your account has been banned by the administrator."
      : "Your account has been unbanned by the administrator.",
    type: user.isBlocked ? "ERROR" : "SUCCESS",
  });

  return user;
};