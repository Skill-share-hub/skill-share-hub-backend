import { Enrollment } from "../enrollments/enrollment.model";
import { User } from "../users/user.model";
import { ApiError } from "../../utils/ApiError";
import {  getCourses } from "../courses/course.service";
import { Course } from "../courses/course.model";
import { IQuery } from "./dashboard.validation";
import { Transaction } from "../wallet/wallet.model";
import { Types } from "mongoose";
import { CREDIT_VALUE } from "../wallet/wallet.constant";

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

export const getTutorDashboardData = async (userId: string) => {
  const tutorCourses = await Course.find({ tutorId: userId });
  const totalCourses = tutorCourses.length;

  const courseIds = tutorCourses.map(c => c._id);
  const totalEnrollments = await Enrollment.countDocuments({ courseId: { $in: courseIds } });

  // Calculate average rating across all courses
  const totalRatingPoints = tutorCourses.reduce((sum, course) => sum + (course.ratingsAverage || 0), 0);
  const avgRating = totalCourses > 0 ? Number((totalRatingPoints / totalCourses).toFixed(1)) : 0;

  const revenueResult = await Transaction.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        type: "tutor_earning",
        status: "completed"
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" }
      }
    }
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  
    const isPremiumTutorEligible = avgRating >= 1 && totalEnrollments >= 2 && totalCourses >= 1 && totalRevenue >= 100;


  return {
    totalCourses,
    totalEnrollments,
    totalRevenue,
    avgRating,
    isPremiumTutorEligible
  };
};

export const getAdminDashboardStats = async () => {
  const [userRes, courseRes, enrollmentRes, revenueRes] = await Promise.all([
    User.aggregate([
      { $match: { role: { $ne: "admin" } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          students: { $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] } },
          tutors: { $sum: { $cond: [{ $eq: ["$role", "tutor"] }, 1, 0] } },
          premiumTutors: { $sum: { $cond: [{ $eq: ["$role", "premiumTutor"] }, 1, 0] } }
        }
      }
    ]),
    Course.aggregate([
      { $match: { status: "published" } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          credit: { $sum: { $cond: [{ $eq: ["$courseType", "credit"] }, 1, 0] } },
          paid: { $sum: { $cond: [{ $eq: ["$courseType", "paid"] }, 1, 0] } }
        }
      }
    ]),
    Enrollment.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          creditEnrollments: { $sum: { $cond: [{ $eq: ["$courseSnapshot.courseType", "credit"] }, 1, 0] } },
          paidEnrollments: { $sum: { $cond: [{ $eq: ["$courseSnapshot.courseType", "paid"] }, 1, 0] } },
          totalTime: { $sum: "$totalWatchTime" },
          creditTime: { $sum: { $cond: [{ $eq: ["$courseSnapshot.courseType", "credit"] }, "$totalWatchTime", 0] } },
          paidTime: { $sum: { $cond: [{ $eq: ["$courseSnapshot.courseType", "paid"] }, "$totalWatchTime", 0] } }
        }
      }
    ]),
    Transaction.aggregate([
      { 
        $match: { 
          status: "completed",
          $or: [
            { type: "platform_commission" },
            { platformCommission: { $gt: 0 } }
          ]
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { 
            $sum: {
              $cond: [
                { $eq: ["$type", "platform_commission"] },
                "$currency",
                { $multiply: ["$platformCommission", CREDIT_VALUE] }
              ]
            }
          },
          totalCredits: { 
            $sum: {
              $cond: [
                { $eq: ["$type", "platform_commission"] },
                "$amount",
                "$platformCommission"
              ]
            }
          }
        }
      }
    ])
  ]);

  // Extract objects or provide defaults if no data exists
  const u = userRes[0] || { total: 0, students: 0, tutors: 0, premiumTutors: 0 };
  const c = courseRes[0] || { total: 0, credit: 0, paid: 0 };
  const e = enrollmentRes[0] || { totalEnrollments: 0, creditEnrollments: 0, paidEnrollments: 0, totalTime: 0, creditTime: 0, paidTime: 0 };
  const r = revenueRes[0] || { totalRevenue: 0, totalCredits: 0 };


  // Return a consistent array that frontend can .map() over
  return [
    {
      title: "Users",
      count: u.total,
      details: [
        { label: "Students", value: u.students },
        { label: "Tutors", value: u.tutors },
        { label: "Premium", value: u.premiumTutors }
      ]
    },
    {
      title: "Courses",
      count: c.total,
      details: [
        { label: "Credit", value: c.credit },
        { label: "Paid", value: c.paid }
      ]
    },
    {
      title: "Enrollments",
      count: e.totalEnrollments,
      details: [
        { label: "Credit", value: e.creditEnrollments },
        { label: "Paid", value: e.paidEnrollments }
      ]
    },
    {
      title: "Watch Time",
      count: e.totalTime,
      unit: "min",
      details: [
        { label: "Credit", value: e.creditTime },
        { label: "Paid", value: e.paidTime }
      ]
    },
    {
      title: "Revenue",
      count: r.totalRevenue,
      unit: "INR",
      details: [
        { label: "Platform Credits", value: r.totalCredits }
      ]
    }
  ];
};

export const getEnrollmentChart = async (groupBy:IQuery["eGroupBy"]) => {

  const now = new Date();
  let startDate = new Date();
  let pipeline: any[] = [];

  if (groupBy === "days") {
    startDate.setDate(now.getDate() - 6); // last 7 days
  }

  if (groupBy === "weeks") {
    startDate.setDate(now.getDate() - 28); // last 4 weeks
  }

  if (groupBy === "months") {
    startDate.setMonth(now.getMonth() - 11); // last 12 months
  }

  if (groupBy === "years") {
    startDate.setFullYear(now.getFullYear() - 4); // last 5 years
  }

  pipeline.push({
    $match: {
      createdAt: { $gte: startDate, $lte: now }
    }
  });

  if (groupBy === "days") {
    pipeline.push({
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt"
          }
        },
        count: { $sum: 1 }
      }
    });
  }

  if (groupBy === "months") {
    pipeline.push({
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$createdAt"
          }
        },
        count: { $sum: 1 }
      }
    });
  }

  if (groupBy === "years") {
    pipeline.push({
      $group: {
        _id: {
          $dateToString: {
            format: "%Y",
            date: "$createdAt"
          }
        },
        count: { $sum: 1 }
      }
    });
  }

  if (groupBy === "weeks") {
    pipeline.push({
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          week: { $isoWeek: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    });
  }

  pipeline.push({
    $sort: { _id: 1 }
  });

  const rawData = await Enrollment.aggregate(pipeline);

  const formattedData = rawData.map((item) => {
    let label = "";

    if (groupBy === "weeks") {
      label = `Week ${item._id.week}`;
    } else {
      label = item._id; 
    }

    return {
      label,
      count: item.count
    };
  });

  return formattedData;
  
}

export const getTopPerformingCourses = async (courseType:IQuery["tCourseType"]) => {

  const query = {
    status : "published",
    courseType,
  }

  const courses = await Course.aggregate([
    { $match: query },

    {
      $lookup: {
        from: "users",
        localField: "tutorId",
        foreignField: "_id",
        as: "tutor"
      }
    },

    { $unwind: "$tutor" },

    {
      $project: {
        _id: 0,
        title: 1,
        tutorName: "$tutor.name"
      }
    },

    {
      $sort: {
        ratingsAverage: -1,
        totalEnrollments: -1
      }
    },

    { $limit: 5 }
  ]);

  return courses ;
}

export const getRecentActivities = async (query: IQuery) => {
  const { limit = 10, type } = query;
  const perTypeLimit = Math.floor(limit / 4);

  const getEnrollments = (limit: number) =>
    Enrollment.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: "userId", select: "name -_id" })
      .populate({path : "courseId", select : "title -_id"})
      .select("courseId userId status createdAt")
      .lean()
      .then(data =>
        data.map(item => ({
          type: "course_enrollment",
          title: (item.courseId as any)?.title,
          userName: (item.userId as any)?.name,
          status: item.status,
          createdAt: item.createdAt
        }))
      );

  const getCourses = (limit: number) =>
    Course.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: "tutorId", select: "name -_id" })
      .select("title tutorId status courseType createdAt")
      .lean()
      .then(data =>
        data.map(item => ({
          type: "course_creation",
          title: item.title,
          tutorName: (item.tutorId as any)?.name,
          courseType: item.courseType,
          createdAt: item.createdAt
        }))
      );

  const getUsers = (limit: number) =>
    User.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("name avatarUrl createdAt")
      .lean()
      .then(data =>
        data.map(item => ({
          type: "user_creation",
          name: item.name,
          avatar: item.avatarUrl,
          createdAt: item.createdAt
        }))
      );

  const getWithdrawals = (limit: number) =>
    Transaction.find({
      type: "credit_withdraw",
      status: { $in: ["completed", "pending"] }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: "userId", select: "name -_id" })
      .select("amount status createdAt")
      .lean()
      .then(data =>
        data.map(item => ({
          type: "withdrawal_request",
          amount: item.amount,
          userName: (item.userId as any)?.name,
          status: item.status,
          createdAt: item.createdAt
        }))
      );

  if (type) {
    switch (type) {
      case "course_enrollment":
        return await getEnrollments(limit);
      case "course_creation":
        return await getCourses(limit);
      case "user_creation":
        return await getUsers(limit);
      case "withdrawal_request":
        return await getWithdrawals(limit);
      default:
        return [];
    }
  }

  const [enrollments, courses, users, withdrawals] = await Promise.all([
    getEnrollments(perTypeLimit),
    getCourses(perTypeLimit),
    getUsers(perTypeLimit),
    getWithdrawals(perTypeLimit)
  ]);

  const data = [...enrollments, ...courses, ...users, ...withdrawals] ;

  return data;
};

export const getPlatformRevenueStats = async (groupBy: IQuery["eGroupBy"]) => {
  const now = new Date();
  let startDate = new Date();
  let pipeline: any[] = [];

  if (groupBy === "days") startDate.setDate(now.getDate() - 6);
  if (groupBy === "weeks") startDate.setDate(now.getDate() - 28);
  if (groupBy === "months") startDate.setMonth(now.getMonth() - 11);
  if (groupBy === "years") startDate.setFullYear(now.getFullYear() - 4);

  // Over Time
  const revenueOverTime = await Transaction.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: startDate, $lte: now },
        $or: [
          { type: "platform_commission" },
          { platformCommission: { $gt: 0 } }
        ]
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupBy === "days" ? "%Y-%m-%d" : groupBy === "months" ? "%Y-%m" : "%Y",
            date: "$createdAt"
          }
        },
        revenue: { 
          $sum: {
            $cond: [
              { $eq: ["$type", "platform_commission"] },
              "$currency",
              { $multiply: ["$platformCommission", CREDIT_VALUE] }
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Per Course
  const revenuePerCourse = await Transaction.aggregate([
    {
      $match: {
        status: "completed",
        $or: [
          { type: "platform_commission" },
          { platformCommission: { $gt: 0 } }
        ]
      }
    },
    {
      $group: {
        _id: "$relatedId",
        totalRevenue: { 
          $sum: {
            $cond: [
              { $eq: ["$type", "platform_commission"] },
              "$currency",
              { $multiply: ["$platformCommission", CREDIT_VALUE] }
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: "enrollments",
        localField: "_id",
        foreignField: "_id",
        as: "enrollment"
      }
    },
    { $unwind: "$enrollment" },
    {
      $group: {
        _id: "$enrollment.courseId",
        revenue: { $sum: "$totalRevenue" }
      }
    },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course"
      }
    },
    { $unwind: "$course" },
    {
      $project: {
        _id: 0,
        courseTitle: "$course.title",
        revenue: 1
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  return {
    revenueOverTime,
    revenuePerCourse
  };
};