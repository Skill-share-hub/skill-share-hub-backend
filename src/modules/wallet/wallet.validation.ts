import { z } from 'zod'
import { CREDIT_WITHDRAW_MAX_LIMIT, CREDIT_WITHDRAW_MIN_LIMIT } from './wallet.constant';

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

export const withdrawSchema = z.object({
  amount : z
  .coerce.number()
  .min(CREDIT_WITHDRAW_MIN_LIMIT,`minimum ${CREDIT_WITHDRAW_MIN_LIMIT} credits required`)
  .max(CREDIT_WITHDRAW_MAX_LIMIT,`maximum ${CREDIT_WITHDRAW_MAX_LIMIT} credits allowed!`)
})

export type IQuery = z.infer<typeof QuerySchema> ;