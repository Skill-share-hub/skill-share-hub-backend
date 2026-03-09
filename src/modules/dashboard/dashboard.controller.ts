import { Request, Response } from "express";
export const getStudentDashboard = (req: Request, res: Response) => {

const enrolledCourses: any[] = []
const recommendedCourses: any[] = []
    const creditBalance = 0

    res.json({
        enrolledCourses,
        recommendedCourses,
        creditBalance
    })
}
export const getTutorDashboard = (req: Request, res: Response) => {

    const createdCourses:any[] = []
    const totalEnrollments  = 0
    const earnings  = 0

    res.json({
        createdCourses,
        totalEnrollments,
        earnings 
    })
}