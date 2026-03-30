import { NextFunction, Request,Response } from "express"
import { getStudentDashboardData, getAdminDashboardStats , getTutorDashboardData, getEnrollmentChart , getTopPerformingCourses , getRecentActivities } from "./dashboard.service"
import { QuerySchema } from "./dashboard.validation";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";

export const getStudentDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const data = await getStudentDashboardData(userId);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard"
    });
  }
};

export const getTutorDashboard = async(req:Request,res:Response) => {
 try {
    const userId = req.user._id;
    const data = await getTutorDashboardData(userId);
    res.json(data)
    } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard"
    });
  }
}

export const getAdminDashboard = async (req:Request , res:Response , next:NextFunction) => {
  try{

    const result = QuerySchema.safeParse(req.query);

    if (!result.success) {
      const message = result.error.issues
        .map((issue, i) => {
          return String(issue.path[i]) + " ---> " + issue.message
        })
        .join(' | ');

      throw new ApiError(400, message);
    }

    const stats = await getAdminDashboardStats();

    const enrollmentChart = await getEnrollmentChart(result.data.eGroupBy);

    const topCourses = await getTopPerformingCourses(result.data.tCourseType);

    const recentActivity = await getRecentActivities(result.data);

    res.status(200).json(
      new ApiResponse("Dashboard data fetch successfull!",{
        stats,
        enrollmentChart,
        topCourses,
        recentActivity
      })
    )

  }catch(error){
    next(error);
  }
}