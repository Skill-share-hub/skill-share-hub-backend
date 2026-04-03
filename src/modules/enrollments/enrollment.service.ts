import { Types } from "mongoose";
import { Enrollment } from "./enrollment.model";
import { ApiError } from "../../utils/ApiError";
import { User } from "../users/user.model";
import { Content, Course } from "../courses/course.model";
import { askAi } from "../../services/askai.service";


export const enrolledCourses = async (userId:Types.ObjectId,status:string)=> {
    if(!["active","completed"].includes(status)){
        throw new ApiError(400,"Invalid status");
    }
    const courses = await Enrollment.find({status,userId});

    const inProgress = await Enrollment.countDocuments({status:"active",userId});
    const completed = await Enrollment.countDocuments({status:"completed",userId});
    const totalEnrollment = await Enrollment.countDocuments({userId});

    const user = await User.findById(userId).select("savedCourses");

    return {
        totalEnrollment,
        courses,
        inProgress,
        completed,
        saved : user?.savedCourses.length || 0
    }
}

export const enrollmentById = async (courseId:string,userId:Types.ObjectId)=> {

    const enrollment = await Enrollment.findOne({courseId,userId}).lean();
    if(!enrollment) throw new ApiError(404, "Enrollment not found");

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

    const alreadyCompleted = enrollment.completedContent.includes(content._id)

    const updatedEnrollment = await Enrollment.findOneAndUpdate(
        { courseId, userId },
            alreadyCompleted
            ? { $pull: { completedContent: content._id } , $inc : { totalWatchTime : -(content.duration ?? 1)} }
            : { $push: { completedContent: content._id } , $inc : { totalWatchTime : content.duration} },
        {returnDocument: 'after',runValidators : true}
    );

    if (!updatedEnrollment) throw new ApiError(404, "Enrollment not found");

    const progress = (
        (updatedEnrollment.completedContent.length / (updatedEnrollment.totalContents > 0 ? updatedEnrollment.totalContents : 1)) * 100
    )?.toFixed(0) || 0;

    const isCompleted =
        updatedEnrollment.completedContent.length === updatedEnrollment.totalContents;

    updatedEnrollment.status = isCompleted ? "completed" : "active";
    updatedEnrollment.progress = Number(progress);

    await updatedEnrollment.save();

    return {
        enrollment : updatedEnrollment,
        completed : !alreadyCompleted
    };
}

export const makeQuizService = async (contentId : string , userId:string) => {
    const content = await Content.findById(contentId).select("title summary").lean();
    if(!content)throw new ApiError(404,"content not found");

    const enrollment = await Enrollment.findOne(
        {userId , courseId : content.courseId}
    ).lean();
    if(!enrollment)throw new ApiError(403,"user not enrolled the course!");

    const prompt = `
       Generate exactly 3 multiple-choice questions based on the given content.

        Rules:

        Each question must have exactly 4 options.
        Only one option must be correct.
        Do NOT include explanations.
        Do NOT include any extra text.
        Output must be in valid JSON format only.

        Format:

        [
            {
                "question": "Question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": "Correct option"
            }
        ]
        
        Content:
        { title : ${content.title} , summary : ${content.summary} }
    `

    let response:any = {}
    
    try{
        response = await askAi([{role : "system",content : prompt }],"mistralai/mistral-small-3.1-24b-instruct");
    }catch(error){
        response = await askAi([{role : "system",content : prompt }],"meta-llama/llama-3.1-8b-instruct");
    }

    const quizData = JSON.parse(response.content);

    return quizData ;

}
