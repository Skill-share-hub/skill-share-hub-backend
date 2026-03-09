import { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../modules/users/user.model";
import jwt from 'jsonwebtoken'

export async function checkToken(token:string){
  if(!token) return null ;
  
  const decoded = jwt.verify(
      token,
      env.jwtAccessSecret,
    ) as JwtPayload;

    const user = await User.findById(decoded.userId).select(
      "_id name email role verificationStatus",
    );
    return user ;
}