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
  .min(1, "Price must be at least 1")
  .optional(),

  category : z
  .string()
  .min(3,"Minimum of 3 characters!"),

  contentModules : z
  .array(moduleSchema)
  .default([]),

  courseType : z
  .enum(["credit","paid"]),

  creditCost : z
  .number()
  .nonnegative("Price cannot be negative")
  .min(1, "Price must be at least 1")
  .optional(),

  status : z
  .enum(["pending","published","draft"]),

  thumbnailUrl : z.string(),

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

export type PCourse = z.infer<typeof UpdateStatusSchema>
export type ICourse = z.infer<typeof CourseSchema>;
