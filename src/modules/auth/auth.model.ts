import { model, Schema } from "mongoose";

const RefreshTokenShema=new Schema({
    token:{
        type:String,
        required:true,
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    revoked:{
        type:Boolean,
        default:false,
    },
    revokedAt: {
  type: Date,
  expires: 60 * 60 * 24 * 7
}
})

export const RefreshToken= model("RefreshToken",RefreshTokenShema)
