import { Types } from "mongoose";
import { Enrollment } from "./enrollment.model";
import { ApiError } from "../../utils/ApiError";
import { User } from "../users/user.model";
import { Content, Course } from "../courses/course.model";


export const enrolledCourses = async (userId:Types.ObjectId,status:string)=> {
    if(!["active","completed"].includes(status)){
        throw new ApiError(400,"Invalid status");
    }
    const courses = await Enrollment.find({status,userId});

    const inProgress = await Enrollment.find({status:"active",userId}).countDocuments();
    const completed = await Enrollment.find({status:"completed",userId}).countDocuments();

    const user = await User.findById(userId).select("savedCourses");

    return {
        totalEnrollment : courses.length,
        courses,
        inProgress,
        completed,
        saved : user?.savedCourses.length || 0
    }
}

export const enrollmentById = async (courseId:string,userId:Types.ObjectId)=> {

    const enrollment = await Enrollment.findOne({courseId,userId}).lean();
    if(!enrollment) throw new ApiError(404,"Enrollment not found");

    const user = await User.findById(userId).select("enrolledCourses");
    if(!user?.enrolledCourses.includes(enrollment._id)){
        throw new ApiError(403,"User is not enrolled in this course");
    }

    const course = await Course.findById(courseId)
    .populate({
        path:"tutorId",
        select:"name avatarUrl tutorProfile.experience tutorProfile.bio"
    })
    .populate("contentModules").lean();
    if(!course) throw new ApiError(404,"Course not found");

    return {
        enrollment,
        course
    }

}

export const markContentService = async (courseId:string , userId:Types.ObjectId , payload:{contentId:string})=> {
    
    if(!payload.contentId) throw new ApiError(400,"Content id is required");

    const content = await Content.findById(payload.contentId);
    if(!content) throw new ApiError(404,"Content not found");
    
    const enrollment = await Enrollment.findOne({courseId,userId});
    if(!enrollment) throw new ApiError(404,"Enrollment not found");

    if(enrollment.completedContent.includes(content._id)){
        await Enrollment.updateOne({courseId,userId},{$pull:{completedContent:content._id}});
    }else{
        await Enrollment.updateOne({courseId,userId},{$push:{completedContent:content._id}});
    }

    const progress = (enrollment.completedContent.length / enrollment.totalContents) * 100;
    enrollment.progress = progress;
    await enrollment.save();
    
    return enrollment;
}