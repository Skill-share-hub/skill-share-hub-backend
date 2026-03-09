import { model, Schema } from "mongoose";
import type { ICourse } from "./course.validation";

const courseSchema = new Schema<ICourse>({
  tutorId : {
    type : Schema.Types.ObjectId,
    ref : "User"
  },

  title : {
    type : String,
    required : true
  },
  description : {
    type : String,
    required : true
  },
  price : {
    type : Number,
    default : 0
  },
  category : {
    type : String,
    required : true
  },

  contentModules : {
    type : [
      {
        title : String,
        url : {type :String,required : true},
        summary : String,
        thumbnile : String,
        duration : {type : Number , required : true}
      }
    ],
    required : true,
    default : []
  },
  
  courseType : {
    type : String,
    required : true,
    enum : ["credit","paid"]
  },

  courseLevel : {
    type : String,
    required : true,
    enum : ["beginner","intermediate","expert"]
  },

  courseSkills : {
    type : [String],
    default : ["No skills"]
  },
  
  creditCost : {
    type : Number,
    default : 0
  },
  ratingsAverage : {
    type : Number,
    required : true,
    default : 2.0
  },
  status : {
    type : String,
    required : true,
    enum : ["pending","published","draft"]
  },
  thumbnailUrl : {
    type : String,
    default : ""
  },
  totalEnrollments : {
    type : Number,
    default : 0
  }
},{timestamps : true});

export const Course = model<ICourse>("Course",courseSchema);