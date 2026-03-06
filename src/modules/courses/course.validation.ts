import { Types } from 'mongoose';
import {z} from 'zod'

const moduleSchema = z.object({
  title : z
  .string()
  .min(5,"Minimum of 5 characters!")
  .max(100,"Maximum of 100 characters!"),

  url : z.string(),
  summary : z.string().optional(),
  thumbnile : z.string().optional(),
  duration : z.number().min(5)
});

const baseSchema = z.object({
  title : z
  .string()
  .min(5,"Minimum of 5 characters!")
  .max(100,"Maximum of 100 characters!"),

  description : z
  .string()
  .min(5,"Minimum of 5 characters!")
  .max(500,"Maximum of 500 characters!"),

  price : z
  .number()
  .nonnegative("Price cannot be negative")
  .optional(),

  category : z
  .string()
  .min(3,"Minimum of 3 characters!"),

  contentModules : z
  .array(moduleSchema)
  .default([]),

  courseType : z
  .enum(["credit","paid"]),

  courseSkills : z
  .array(z.string())
  .min(1, "Skills cannot be empty")
  .max(10, "Skills cannot have more than 10"),

  creditCost : z
  .number()
  .nonnegative("Price cannot be negative")
  .optional(),

  status : z
  .enum(["pending","published","draft"]),

  thumbnailUrl : z.string().optional(),
  courseLevel : z.enum(["beginner","intermediate","expert"])
})

export const CourseSchema = baseSchema.extend({
  tutorId : z
  .string()
  .refine((id)=>Types.ObjectId.isValid(id),{ message: "Invalid ObjectId" })
  .transform((id) => new Types.ObjectId(id))
  .optional(),

  ratingsAverage : z
  .number()
  .min(1.0,"Rating Needs to be 1.0 atleast")
  .max(5.0,"Rating Needs to be 5.0 atmost!")
  .optional(),

  totalEnrollments : z
  .number()
  .nonnegative("Should be Positive")
  .optional()
})
.refine(data => {
   if(data.courseType === "paid") return data.price
   if(data.courseType === "credit") return data.creditCost
},{
    message: "Paid courses require price. Credit courses require creditCost.",
    path: ["courseType"]
})

export const UpdateCourseSchema = baseSchema.partial()

export const UpdateStatusSchema = z.object({
  status : z.enum(["pending","published","draft"])
});

export const QuerySchema = z.object({
  q : z
  .string()
  .trim()
  .min(2, "Search string must be at least 2 characters long")
  .max(50, "Search string cannot exceed 50 characters")
  .optional(),

  limit : z
  .string()
  .min(1, 'Limit must be at least 1')
  .max(100, 'Limit cannot exceed 100')
  .transform(val => Number(val))
  .default(10),

  page : z
  .string()
  .min(1, 'Page must be at least 1')
  .transform(val => Number(val))
  .default(1),

  c : z
  .string()
  .min(3, "Minimum 3 characters needed!")
  .max(50,"Maximum 50 characters allowed!")
  .lowercase()
  .optional(),

  type : z
  .enum(["credit","paid"])
  .optional(),

  sort : z
  .enum(["latest","popular"])
  .optional(),

  recommended : z
  .enum(["true","false"])
  .default("false")
  .transform(val => val === "true")
});

export type TQuery = z.infer<typeof QuerySchema>
export type PCourse = z.infer<typeof UpdateStatusSchema>
export type ICourse = z.infer<typeof CourseSchema>;
