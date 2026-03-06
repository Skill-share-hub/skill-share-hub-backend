import { NextFunction, Request,Response } from "express"
import { QuerySchema, type ICourse } from "./course.validation"
import { changeStatus, editCourse, getCourse, getCourses, makeCourse } from "./course.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { User } from "../users/user.model";
import { ApiError } from "../../utils/ApiError";
import { checkToken } from "../../utils/checkToken";


export const createCourse = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const payload = req.body as ICourse ;
    const course = await makeCourse(payload,req.user?._id,req.user?.role);

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

    const course = await editCourse(payload,courseId, req.user?._id, req.user?.role);

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

export const getAllCourses = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const result = QuerySchema.safeParse(req.query);

    if(!result.success){
      const message = result.error.issues
      .map((issue,i) => {
        return String(issue.path[i]) + " ---> " + issue.message
      })
      .join(' | ');
      
      throw new ApiError(400,message);
    }

    const token = req.cookies.accessToken;
    const user = await checkToken(token);

    const courses = await getCourses(result.data,user?._id || "");

    res.status(200).json(
      new ApiResponse("Courses Found!",courses,true)
    );

  }catch(error){
    next(error);
  }
}

export const getSingleCourse = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const courseId = Array.isArray(req.params?.id) ? req.params?.id[0] : req.params?.id ;
    const course = await getCourse(courseId);

    res.status(200).json(
      new ApiResponse("course fetched successfully",course,true)
    )
  }catch(error){
    next(error)
  }
}