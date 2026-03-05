import { Types } from "mongoose";

interface CourseModules {
  title : string;
  url : string;
  thumbnile ?: string;
  duration : number;
  summary ?: string;
}

export interface ICourse {
  _id : Types.ObjectId;
  tutorId : Types.ObjectId

  title : string;
  description : string;
  courseType : "credit" | "paid";
  contentModules : CourseModules[] | []
  price : number;
  creditCost : number;
  category : string;
  thumbnailUrl : string;
  ratingsAverage : number;
  totalEnrollments : number;
  status : "pending" | "published" | "draft"
  
  createdAt : string
}