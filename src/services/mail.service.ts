import { mailTransport } from "../config/mail";
import { env } from "../config/env";

export const sendEmail=async(to:string,subject:string,html:string)=>{
    try{
        await mailTransport.sendMail({
            from:`"SkillShareHub <${env.emailUser}>"`,
            to,
            subject,
            html  
        }) 
    }catch(error){
        console.log(error)
    }
}

