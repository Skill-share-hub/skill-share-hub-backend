import { Types } from "mongoose";
import { Content, Course } from "./course.model";
import { IContent, ICourse, PCourse, TQuery } from "./course.validation";
import { ApiError } from "../../utils/ApiError";
import { QueryType, SortType } from "./course.type";
import { User } from "../users/user.model";

export const makeCourse = async (input:ICourse, tutorId:Types.ObjectId, role:string , thumbnailUrl:string) => {

  const {
    category,
    contentModules,
    courseSkills,
    courseType,
    creditCost,
    description,
    price,
    status,
    courseLevel,
    title
  } = input;

  if(role !== "premiumTutor" && courseType === "paid"){
    throw new ApiError(400,"Only premium tutor can create paid courses!");
  }


  const course = await Course.create({
    tutorId,
    title,
    category,
    contentModules,
    courseType,
    courseLevel,
    courseSkills,
    creditCost,
    description,
    price : role === "premiumTutor" ? price : 0,
    ratingsAverage : 2.0,
    status,
    thumbnailUrl : thumbnailUrl ?? "",
    totalEnrollments : 0
  });

  if(!course) throw new ApiError(400,"Course creation failed!");

  return course
}

export const editCourse = async (input:Partial<ICourse>, courseId:string, tutorId:string, role:string) => {

  if (!Types.ObjectId.isValid(courseId)) throw new ApiError(400,"Invalid Course ID!");

  const {
    category,
    contentModules,
    courseType,
    creditCost,
    description,
    courseSkills,
    price,
    thumbnailUrl,
    courseLevel,
    title
  } = input;

  if(role !== "premiumTutor" && courseType === "paid"){
    throw new ApiError(400,"Only premium tutor can create paid courses!");
  }

  const course = await Course.findOneAndUpdate({_id : courseId,tutorId},{
    category,
    contentModules,
    courseType,
    courseSkills,
    courseLevel,
    creditCost,
    description,
    price : role === "premiumTutor" ? price : 0,
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

export const getCourses = async (query:TQuery, userId:Types.ObjectId | string) => {

  const queryObj:QueryType = {}
  let sortObj:SortType = {}
  
  const {limit,page} = query ;
  const skip = (page-1) * limit ;

  if(query.c){
    queryObj.category = query.c ;

  }else if(userId && query.recommended){

    const user = await User.findById(userId)
    .select("studentProfile.interests studentProfile.skills")
    .lean();
    const interests = user?.studentProfile?.interests ?? []
    const skills = user?.studentProfile?.skills ?? []

    queryObj.$or = [
      {category : {$in : interests}},
      {courseSkills : {$in :skills}}
    ]
  }

  if(query.type){
    queryObj.courseType = query.type ; 
  }

  if(query.q){
    queryObj.title = { $regex: query.q, $options: "i" } ;
  }

  if(query.sort === "latest"){
    sortObj = { createdAt: -1 }
  }

  if(query.sort === "popular"){
    sortObj = {
      totalEnrollments: -1,
      ratingsAverage: -1
    }
  }

  const courses = await Course.find(queryObj).sort(sortObj).skip(skip).limit(limit);

  return courses

}

export const getCourse = async (courseId:string) => {
  const course = await Course.findById(courseId).populate({
    path : "tutorId",
    select : "_id name avatarUrl email tutorProfile"
  })
  .populate({
    path : "contentModules",
    select : "-contentUrl"
  })

  if(!course){
    throw new ApiError(404,"Course not found!");
  }
  return course ;
}

export const removeCourse = async (courseId:string, userId:Types.ObjectId) => {  

  const user = await User.findOne({_id : userId, "tutorProfile.createdCourses" : courseId}).lean();

  if(!user){
    throw new ApiError(403,"This course does not belong to the tutor.");
  }

  const course = await Course.deleteOne({_id : courseId});
  if(course.deletedCount === 0)throw new ApiError(404,"Course not found!");

  await User.updateOne({_id : userId},{$pull : {"tutorProfile.createdCourses" : courseId}});

  return true
}

export const tutorCourses = async (tutorId:Types.ObjectId) => {
  const courses = await Course.find({tutorId}).populate("contentModules");
  return courses
}

export const makeContent = async (input:Required<IContent>,courseId:string) => {

  const {contentUrl,duration,summary,thumbnailUrl,title} = input ;

  const course = await Course.findById(courseId).lean();
  if(!course)throw new ApiError(404,"No course found!");

  const content = await Content.create({
    courseId,
    contentUrl,
    duration,
    summary,
    thumbnailUrl,
    title
  });

  await Course.updateOne({_id : courseId},{$push:{contentModules : content._id}});

  return content ;

}


