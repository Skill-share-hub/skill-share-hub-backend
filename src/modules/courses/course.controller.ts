import { NextFunction, Request,Response } from "express"
import type { ICourse, PCourse } from "./course.validation"
import { changeStatus, editCourse, makeCourse } from "./course.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { User } from "../users/user.model";
import { ApiError } from "../../utils/ApiError";


export const createCourse = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const payload = req.body as ICourse ;
    const course = await makeCourse(payload,req.user?._id);

    const user = await User.findOneAndUpdate({_id : req.user?._id},{
      $push: { "tutorProfile.createdCourses": course._id }
    },{returnDocument: "after",runValidator:true});

    if(!user)throw new ApiError(400,"Course doesn't attached to user!");

    res.status(201).json(
      new ApiResponse("Course created successfully",course,true)
    );
    
  }catch(error){
    next(error)
  }
}

export const updateCourse = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const payload = req.body as Partial<ICourse> ;
    const courseId = Array.isArray(req.params?.id) ? req.params?.id[0] : req.params?.id ;

    const course = await editCourse(payload,courseId,req.user?._id);

    res.status(200).json(
      new ApiResponse("Course updated successfully",course,true)
    );

  }catch(error){
    next(error);
  }
}

export const changeCourseStatus = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const courseId = Array.isArray(req.params?.id) ? req.params?.id[0] : req.params?.id ;

    const course = await changeStatus(req.body.status,courseId,req.user?._id);

    res.status(200).json(
      new ApiResponse("Status updated successfully",course,true)
    );
  }catch(error){
    next(error);
  }
}