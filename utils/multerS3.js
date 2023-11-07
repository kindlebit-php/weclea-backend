import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client} from '@aws-sdk/client-s3';

const USER_KEY ='AKIAQN6QN5FKDLFL2AOZ';
const USER_SECRET = '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';
const BUCKET_NAME = 'weclea-bucket';

const s3 = new S3Client({
    credentials: {
        accessKeyId: USER_KEY, // store it in .env file to keep it safe
        secretAccessKey: USER_SECRET
    },
    region: "us-east-2" // this is the region that you select in AWS account
})

export const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
        //cb(null, file.originalname); 
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
})

