import { Schema } from "mongoose";

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
    }
})

export const RefreshToken=model("RefreshToken",RefreshTokenShema)
