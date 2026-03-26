import { z } from 'zod'


export const QuerySchema = z.object({
  eGroupBy : z
  .enum(["days","weeks","months","years"])
  .default("months"),

  tCourseType : z
  .enum(["credit","paid"])
  .default("credit"),

  limit : z
  .coerce.number()
  .min(5)
  .default(5),

  page : z
  .coerce.number()
  .min(1)
  .default(1),

  type : z
  .enum(["course_creation","withdrawal_request","user_creation","course_enrollment",""])
  .default("")
})


export type IQuery = z.infer<typeof QuerySchema>