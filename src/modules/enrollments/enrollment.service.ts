import { Types } from "mongoose";
import { Enrollment } from "./enrollment.model";
import { ApiError } from "../../utils/ApiError";
import { User } from "../users/user.model";
import { Course } from "../courses/course.model";


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

    const course = await Course.findById(courseId).populate("contentModules").lean();
    if(!course) throw new ApiError(404,"Course not found");

    return {
        enrollment,
        course
    }

}