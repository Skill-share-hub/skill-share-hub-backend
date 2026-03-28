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
  },

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image") ||
      file.mimetype.startsWith("video")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos allowed"));
    }
  }

});


const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export const uploadApplicationFiles = multer({
  storage: multerS3({
    s3,
    bucket: env.awsBucket,
    contentType: multerS3.AUTO_CONTENT_TYPE, 
    key: (req, file, cb) => {
      const folder = file.fieldname === "profilePhoto" ? "profiles" : "documents";
      const fileName = `${folder}/${randomUUID()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB — docs don't need 1GB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and PDF files are allowed."));
    }
    cb(null, true);
  },
}).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "documents", maxCount: 5 },
]);