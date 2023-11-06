const { S3Client } = require('@aws-sdk/client-s3')
const multer = require('multer')
const multerS3 = require('multer-s3')

const USER_KEY ='AKIAQN6QN5FKDLFL2AOZ';
const USER_SECRET = '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';
const BUCKET_NAME = 'weclea-bucket';

const s3 = new S3Client({
    credentials: {
        accessKeyId: USER_KEY, // store it in .env file to keep it safe
        secretAccessKey: USER_SECRET
    },
    region: "ap-south-1" // this is the region that you select in AWS account
})

export const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME+"/uploads",
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})

