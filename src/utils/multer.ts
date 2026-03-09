import multer from 'multer'
import multerS3 from 'multer-s3'
import { s3 } from '../config/s3'
import { env } from '../config/env'
import { randomUUID } from 'crypto'


export const upload = multer({
  storage : multerS3({
    s3,
    bucket : env.awsBucket,
    contentType : multerS3.AUTO_CONTENT_TYPE,

    key : (req,file,cb) => {

      const folder = file.mimetype.startsWith("video") ? "videos" : "images";

      const fileName = `${folder}/${randomUUID()}-${file.originalname}`
      cb(null,fileName)
    }
  }),
  limits: {
    fileSize: 1024 * 1024 * 1024 
  }
});