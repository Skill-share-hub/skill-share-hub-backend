import { Types } from "mongoose";
import { Content, Course } from "./course.model";
import { IContent, ICourse, PCourse, TQuery } from "./course.validation";
import { ApiError } from "../../utils/ApiError";
import { QueryType, SortType } from "./course.type";
import { User } from "../users/user.model";
import { COURSE_CATEGORIES } from "./course.constants";
import { deleteFromS3, getS3KeyFromUrl } from "../../utils/deleteFromS3";

export const makeCourse = async (input: ICourse, tutorId: Types.ObjectId, role: string, thumbnailUrl: string) => {

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

  if (role !== "premiumTutor" && courseType === "paid") {
    throw new ApiError(400, "Only premium tutor can create paid courses!");
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
    price: role === "premiumTutor" ? price : 0,
    ratingsAverage: 2.0,
    status,
    thumbnailUrl: thumbnailUrl ?? "",
    totalEnrollments: 0
  });

  if (!course) throw new ApiError(400, "Course creation failed!");

  return course
}

export const editCourse = async (input: Partial<ICourse>, courseId: string, tutorId: string, role: string) => {

  if (!Types.ObjectId.isValid(courseId)) throw new ApiError(400, "Invalid Course ID!");

  if (role !== "premiumTutor" && input.courseType === "paid") {
    throw new ApiError(400, "Only premium tutor can create paid courses!");
  }

  // Build update object only with defined fields
  const updateData: any = {};
  const fields = [
    'category', 'contentModules', 'courseType', 'creditCost',
    'description', 'courseSkills', 'price', 'thumbnailUrl',
    'courseLevel', 'title'
  ];

  fields.forEach(field => {
    const value = input[field as keyof Partial<ICourse>];
    if (value !== undefined) {
      if (field === 'price') {
        updateData.price = role === "premiumTutor" ? value : 0;
      } else {
        updateData[field] = value;
      }
    }
  });

  const course = await Course.findOneAndUpdate(
    { _id: courseId, tutorId },
    { $set: updateData },
    { returnDocument: "after", runValidators: true }
  );

  if (!course) throw new ApiError(400, "Course update failed or not found!");

  return course;
}

type statusType = "pending" | "published" | "draft" ;

export const changeStatus = async (status: statusType, id: string, tutorId: string) => {

  if (!Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid Course ID!");

  const course = await Course.findOne({ _id: id, tutorId });
  if (!course) throw new ApiError(400, "Course creation failed!");

  if(!(course.contentModules.length > 0) )throw new ApiError(400,"Course cannot be published add contents");

  course.status = status ;
  await course?.save();

  return course;
}

export const getCourses = async (query: TQuery, userId: Types.ObjectId | string) => {

  const queryObj: Partial<QueryType> = { status : "published" , contentModules : {$ne : []} }
  let sortObj:SortType = {}
  
  const {limit,page} = query ;
  const skip = (page-1) * limit ;

  let user = null ;

  if(userId){
    user = await User.findById(userId)
    .select("enrolledCourses studentProfile.interests studentProfile.skills")
    .lean();
  }

  if (query.c) {
    queryObj.category = query.c;

  }

  if(user){
    queryObj._id = {$nin : user?.enrolledCourses}
  }
  
  if (user && query.recommended) {

    const interests = user?.studentProfile?.interests ?? []
    const skills = user?.studentProfile?.skills ?? []

    queryObj.$or = [
      { category: { $in: interests } },
      { courseSkills: { $in: skills } }
    ]
  }

  if (query.type) {
    queryObj.courseType = query.type;
  }

  if (query.q) {
    queryObj.title = { $regex: query.q, $options: "i" };
  }

  if (query.sort === "latest") {
    sortObj = { createdAt: -1 }
  }

  if (query.sort === "popular") {
    sortObj = {
      totalEnrollments: -1,
      ratingsAverage: -1
    }
  }

  if(query.maxPrice !== undefined && query.minPrice !== undefined){

    if(query.type === "credit"){

      queryObj.creditCost = {$gte : query.minPrice , $lte : query.maxPrice }

    }else if (query.type === "paid"){
      
      queryObj.price = {$gte : query.minPrice , $lte : query.maxPrice }

    }
  }

  if(query.rating){
    queryObj.ratingsAverage = {$gte : query.rating}
  }

  if (query.recommended && query.courseId){
    if(queryObj.$or) delete queryObj.$or;

    const course = await Course.findById(query.courseId);
    queryObj.courseType = course?.courseType ;
    queryObj.title = { $regex: course?.title|| "", $options: "i" } ;
    queryObj.category = course?.category
  }

  let courses = await Course.find(queryObj)
  .populate({
    path : "tutorId",
    select : "_id name avatarUrl"
  })
  .sort(sortObj).skip(skip).limit(limit);

  if(courses.length < limit && query.recommended){
    courses = await Course.find({status : "published"})
    .populate({
      path : "tutorId",
      select : "_id name avatarUrl"
    })
    .skip(skip).limit(limit);
  }

  const totalCount = await Course.countDocuments(queryObj);

  return {
    courses,
    page,
    limit,
    totalCount,
    totalPages : Math.ceil(totalCount/limit),
    categories : COURSE_CATEGORIES
  }

}

export const getCourse = async (
  courseId: string,
  userId: Types.ObjectId | string,
  role?: string
) => {

  // Admin can inspect any course including protected media URLs.
  if (role === "admin") {
    return await Course.findById(courseId)
      .populate({
        path: "tutorId",
        select: "_id name avatarUrl email tutorProfile"
      })
      .populate({
        path: "contentModules",
      })
      .lean();
  }

  // Tutors should always be able to access their own uploaded video URLs.
  if ((role === "tutor" || role === "premiumTutor") && userId) {
    const tutorCourse = await Course.findOne({
      _id: courseId,
      tutorId: userId
    })
      .populate({
        path: "tutorId",
        select: "_id name avatarUrl email tutorProfile"
      })
      .populate({
        path: "contentModules",
      })
      .lean();

    if (tutorCourse) {
      console.log(tutorCourse)
      return tutorCourse;
    }
  }

  let enrolledCourses: Types.ObjectId[] = [];
  if (userId && Types.ObjectId.isValid(String(userId))) {
    const user = await User.findById(userId).select("enrolledCourses").lean();
    enrolledCourses = user?.enrolledCourses ?? [];
  }

  const course = await Course.findOne(
    enrolledCourses.length > 0
      ? {
          $and: [
            { _id: courseId },
            { _id: { $nin: enrolledCourses } }
          ]
        }
      : { _id: courseId }
  )
    .populate({
      path: "tutorId",
      select: "_id name avatarUrl email tutorProfile"
    })
    .populate({
      path: "contentModules",
    })
    .lean();

  if (!course) {
    throw new ApiError(404, "Course not found!");
  }
  console.log(course)
  return course;
};
export const removeCourse = async (courseId: string, userId: Types.ObjectId) => {

  const user = await User.findOne({ _id: userId, "tutorProfile.createdCourses": courseId }).lean();

  if (!user) {
    throw new ApiError(403, "This course does not belong to the tutor.");
  }

  const course = await Course.findOne({ _id: courseId, tutorId: userId }).lean();
  if (!course) throw new ApiError(404, "Course not found!");

  const contents = await Content.find({ courseId: course._id }).lean();

  const s3Keys = [
    getS3KeyFromUrl(course.thumbnailUrl),
    ...contents.flatMap((content) => [
      getS3KeyFromUrl(content.contentUrl),
      getS3KeyFromUrl(content.thumbnailUrl),
    ]),
  ].filter((key): key is string => Boolean(key));

  const deletedCourse = await Course.deleteOne({ _id: courseId, tutorId: userId });
  if (deletedCourse.deletedCount === 0) throw new ApiError(404, "Course not found!");

  await Content.deleteMany({ courseId: course._id });

  await User.updateOne({ _id: userId }, { $pull: { "tutorProfile.createdCourses": courseId } });

  if (s3Keys.length > 0) {
    await Promise.all(s3Keys.map((key) => deleteFromS3(key)));
  }

  return true
}

export const tutorCourses = async (query:TQuery ,tutorId:Types.ObjectId) => {

  const queryObj:Partial<QueryType> & {tutorId:Types.ObjectId} = {
    tutorId
  }
  
  const {limit,page} = query ;
  const skip = (page-1) * limit ;

  if(query.c){
    queryObj.category = query.c ;
  }

  if(query.type){
    queryObj.courseType = query.type ; 
  }

  if(query.q){
    queryObj.title = { $regex: query.q, $options: "i" } ;
  }

  const courses = await Course.find(queryObj).populate("contentModules").skip(skip).limit(limit);

  const totalCount = await Course.countDocuments(queryObj);

  return {
    courses,
    page,
    limit,
    totalCount,
    totalPages : Math.ceil(totalCount/limit)
  }
}

export const makeContent = async (
  input: Required<IContent>,
  courseId: string,
  tutorId: Types.ObjectId
) => {

  const { contentUrl, duration, summary, thumbnailUrl, title , quizData } = input;

  const course = await Course.findOne({ _id: courseId, tutorId }).lean();
  if (!course) throw new ApiError(404, "No course found!");

  const content = await Content.create({
    courseId,
    contentUrl,
    duration,
    summary,
    thumbnailUrl,
    title,
    quizData
  });

  await Course.updateOne({ _id: courseId }, 
  { 
    $push: { contentModules: content._id } ,
    $inc : {courseDuration : duration }
  }
  );

  return content;

}

export const editContent = async (
  input:Required<IContent>,
  contentId:string,
  tutorId: Types.ObjectId
) => {
  const {contentUrl,duration,summary,thumbnailUrl,title , quizData} = input ;

  const existingContent = await Content.findById(contentId).lean();
  if(!existingContent)throw new ApiError(404,"Content not found!");

  const course = await Course.findOne({
    _id: existingContent.courseId,
    tutorId
  }).lean();
  if(!course)throw new ApiError(403,"Course doesn't match with user!");

  const content = await Content.findOneAndUpdate(
    {_id : contentId},
    {
      contentUrl,
      duration,
      summary,
      thumbnailUrl,
      title,
      quizData
    },
    {returnDocument: "after", runValidators:true}
  );

  if(!content)throw new ApiError(404,"Content not found!");

  return content ;
}

export const removeContent =  async (contentId:string, courseId:string, userId:Types.ObjectId) => {

  const course = await Course.findOne({ _id: courseId, tutorId: userId });
  if(!course) throw new ApiError(404,"Course not found!");

  const content = await Content.findOne({
    _id: contentId,
    courseId: course._id
  });
  if(!content)throw new ApiError(404,"Content not found or already deleted!");

  await Course.updateOne(
    { _id: courseId, tutorId: userId },
    { $pull : {contentModules : contentId} }
  );

  await Content.deleteOne({ _id : contentId, courseId: course._id });

  const s3Keys = [
    getS3KeyFromUrl(content.contentUrl),
    getS3KeyFromUrl(content.thumbnailUrl),
  ].filter((key): key is string => Boolean(key));

  if (s3Keys.length > 0) {
    await Promise.all(s3Keys.map((key) => deleteFromS3(key)));
  }

  return true

}




