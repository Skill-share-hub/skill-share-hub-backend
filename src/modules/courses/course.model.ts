import { model, Schema } from "mongoose";
import type { IContent, ICourse } from "./course.validation";

const courseSchema = new Schema<ICourse>({
  tutorId : {
    type : Schema.Types.ObjectId,
    ref : "User",
    required : true
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

  contentModules : [
    {
      type : Schema.Types.ObjectId,
      ref : "Content"
    }
  ],
  
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

  courseDuration : {
    type : Number,
    default : 0
  },

  certified : {
    type : Boolean,
    default : false
  },

  courseResources : {
    type : [String],
    default : []
  },
  
  creditCost : {
    type : Number,
    default : 0
  },
  ratingsAverage : {
    type : Number,
    required : true,
    default : 0
  },
  ratingsCount : {
    type : Number,
    required : true,
    default : 0
  },
  status : {
    type : String,
    required : true,
    enum : ["pending","published","draft","blocked"]
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

const contentSchema = new Schema<IContent>({
  courseId : {
    type : Schema.Types.ObjectId,
    ref : "Course",
    required : true
  },
  title : {
    type : String,
    defalut : "No title"
  },
  contentUrl : {
    type :String,
    required : true
  },
  summary : {
    type : String,
    default : "No Summary"
  },
  thumbnailUrl : String,
  duration : {
    type : Number,
    default : 1
  },

  quizData : [
    {
      question : String,
      options : [String],
      answer : String
    }
  ]
},{timestamps : true});

export const Content = model<IContent>("Content",contentSchema);
export const Course = model<ICourse>("Course",courseSchema);