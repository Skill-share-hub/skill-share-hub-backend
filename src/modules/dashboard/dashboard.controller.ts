import { Request,Response } from "express"
import { getStudentDashboardData, getTutorDashboardData } from "./dashboard.service"
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
    const userId=req.user._id
   const data= await getTutorDashboardData(userId)
    res.json(data)
    } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard"
    });
  }
}