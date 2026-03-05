import { Types } from "mongoose";
import { Course } from "./course.model";
import { ICourse, PCourse } from "./course.validation";
import { ApiError } from "../../utils/ApiError";


export const makeCourse = async (input:ICourse, tutorId:Types.ObjectId) => {

  const {
    category,
    contentModules,
    courseType,
    creditCost,
    description,
    price,
    status,
    thumbnailUrl,
    title
  } = input;

  const course = await Course.create({
    tutorId,
    title,
    category,
    contentModules : contentModules.length > 0 ? contentModules : [],
    courseType,
    creditCost,
    description,
    price,
    ratingsAverage : 2.0,
    status,
    thumbnailUrl,
    totalEnrollments : 0
  });

  if(!course) throw new ApiError(400,"Course creation failed!");

  return course
}

export const editCourse = async (input:Partial<ICourse>,courseId:string,tutorId:string) => {

  if (!Types.ObjectId.isValid(courseId)) throw new ApiError(400,"Invalid Course ID!");

  const {
    category,
    contentModules,
    courseType,
    creditCost,
    description,
    price,
    status,
    thumbnailUrl,
    title
  } = input;

  const course = await Course.findOneAndUpdate({_id : courseId,tutorId},{
    category,
    contentModules,
    courseType,
    creditCost,
    description,
    price,
    status,
    thumbnailUrl,
    title
  },{returnDocument: "after" , runValidators : true});

  if(!course) throw new ApiError(400,"Course creation failed!");

  return course ;
}

export const changeStatus = async (status:PCourse,id:string,tutorId:string) => {

  if (!Types.ObjectId.isValid(id)) throw new ApiError(400,"Invalid Course ID!");

  const course = await Course.findOneAndUpdate({_id : id,tutorId},{ status },{returnDocument: "after",runValidators:true});
  if(!course) throw new ApiError(400,"Course creation failed!");

  return course;
}