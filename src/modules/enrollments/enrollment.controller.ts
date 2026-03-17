import { NextFunction, Request, Response } from "express";
import { enrolledCourses, enrollmentById, markContentService } from "./enrollment.service";
import { ApiResponse } from "../../utils/ApiResponse";


export const getMyEnrollments = async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    try {
        const userId = req.user?._id;
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
        const userId = req.user?._id;

        let courseId = req.params.id as string;
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

export const markContent = async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    try {
        const userId = req.user?._id;
        const courseId = req.params.id as string;

        const payload = req.body as {contentId:string};

        const data = await markContentService(courseId,userId,payload);

        res.status(200).json(
            new ApiResponse("Content marked",data,true)
        );
    } catch (error) {
        next(error);
    }
}
    
