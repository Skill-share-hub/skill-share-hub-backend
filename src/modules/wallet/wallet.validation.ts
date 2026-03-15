import { z } from 'zod'

export const QuerySchema = z.object({
  limit : z
  .coerce
  .number()
  .default(3),

  refresh : z
  .string()
  .transform(val => val.toLowerCase() === "true")
  .default(false),

  status : z
  .enum(["completed" , "pending" , "initialized" , "rejected", ""])
  .default("")
  
});

export type IQuery = z.infer<typeof QuerySchema> ;