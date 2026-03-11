import { NextFunction, Request,Response } from "express"
import { QuerySchema, type ICourse } from "./course.validation"
import { changeStatus, editContent, editCourse, getCourse, getCourses, makeContent, makeCourse, premiumCourse, removeContent, removeCourse, tutorCourses } from "./course.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { User } from "../users/user.model";
import { ApiError } from "../../utils/ApiError";
import { checkToken } from "../../utils/checkToken";
import { MulterFiles } from "./course.type";
import { COURSE_CATEGORIES } from "./course.constants";



export const getCourseCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    res.status(200).json(
      new ApiResponse("Categories fetched successfully", COURSE_CATEGORIES, true)
    );

  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const payload = req.body as ICourse ;

    const file = req.file as Express.Multer.File & { location: string };
    const course = await makeCourse(payload, req.user?._id, req.user?.role , file?.location ?? "");

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
    const file = req.file as Express.Multer.File & { location: string }; 
    if(file?.location){
      payload.thumbnailUrl = file.location
    }

    console.log(payload)

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

    const data = await getCourses(result.data,user?._id || "");

    res.status(200).json(
      new ApiResponse("Courses Found!",data,true)
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

export const deleteCourse = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const courseId = Array.isArray(req.params?.id) ? req.params?.id[0] : req.params?.id ;
    await removeCourse(courseId,req.user?._id);

    res.status(200).json(
      new ApiResponse("Course removed!",null,true)
    )

  }catch(error){
    next(error)
  }
}

export const getTutorCourses = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
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

    const data = await tutorCourses(result.data,req.user?._id);

    res.status(200).json(
      new ApiResponse("Courses found!",data,true)
    );

  }catch(error){
    next(error)
  }
}

export const createContent = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const body = req.body;
    const courseId = Array.isArray(req.params?.id) ? req.params?.id[0] : req.params?.id ;

    const files = req.files as MulterFiles
    const contentUrl = files.contentUrl?.[0]
    const thumbnailUrl = files.thumbnailUrl?.[0]

    if(!contentUrl?.location)throw new ApiError(400,"Content is Required!");

    const payload = {
      ...body,
      contentUrl : contentUrl?.location,
      thumbnailUrl : thumbnailUrl?.location
    }

    const content = await makeContent(payload,courseId);

    res.status(201).json(
      new ApiResponse("Content created!",content,true)
    );

  }catch(error){
    next(error);
  }
} 

export const updateContent = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const body = req.body;
    const contentId = Array.isArray(req.params?.id) ? req.params?.id[0] : req.params?.id ;

    const files = req.files as MulterFiles
    const contentUrl = files.contentUrl?.[0]
    const thumbnailUrl = files.thumbnailUrl?.[0]

    if(!contentUrl?.location && !body.contentUrl)throw new ApiError(400,"Content is Required!");

    const payload = {
      ...body,
      contentUrl : contentUrl?.location,
      thumbnailUrl : thumbnailUrl?.location
    }

    const content = await editContent(payload,contentId);

    res.status(200).json(
      new ApiResponse("Content Updated!",content,true)
    );

  }catch(error){
    next(error)
  }
}

export const deleteContent = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const contentId = Array.isArray(req.params?.contentId) ? req.params?.contentId[0] : req.params?.contentId ;
    const courseId = Array.isArray(req.params?.courseId) ? req.params?.courseId[0] : req.params?.courseId ;

    await removeContent(contentId,courseId,req.user?._id);

    res.status(200).json(
      new ApiResponse("Content deleted successfully!",null,true)
    )
  }catch(error){
    next(error)
  }
}

export const getPremiumCourse = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const courseId = Array.isArray(req.params?.id) ? req.params?.id[0] : req.params?.id ;
    const course = await premiumCourse(courseId);

    res.status(200).json(
      new ApiResponse("Course Found!",course,true)
    );

  }catch(error){
    next(error);
  }
}