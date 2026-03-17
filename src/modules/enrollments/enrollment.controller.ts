import { NextFunction, Request, Response } from "express";
import { enrolledCourses, enrollmentById } from "./enrollment.service";
import { ApiResponse } from "../../utils/ApiResponse";


export const getMyEnrollments = async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    try {
        const userId = req.user?.id;
        const status = req.query.status as string;
        const data = await enrolledCourses(userId,status);
        res.status(200).json(
            new ApiResponse("Enrollments fetched successfully",data,true)
        );
    } catch (error) {
        next(error);
    }
}

export const getEnrollmentById = async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    try {
        const userId = req.user?.id;

        let courseId = req.query.courseId as string;
        if (Array.isArray(courseId)) {
            courseId = courseId[0];
        }
        
        const data = await enrollmentById(courseId,userId);
        res.status(200).json(
            new ApiResponse("Enrollment fetched successfully",data,true)
        );
    } catch (error) {
        next(error);
    }
}
    
