import nodeMailer from 'nodemailer';
import { env } from './env';

export const mailTransport=nodeMailer.createTransport({
    host:env.emailHost,
    port:env.emailPort,
    secure:env.emailSecure,
    auth:{
        user:env.emailUser,
        pass:env.emailPass
    }
})