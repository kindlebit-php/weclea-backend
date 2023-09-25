import { verifyJwtToken } from "../config/generateToken.js";
import dbConnection from'../config/db.js';
export const CheckAuth = async (req, res, next) => {
  try {
    // check for auth header from client

    const header = req.headers.authorization || req.headers.authtoken;
    console.log(!header);

    if (!header) {
      res.json({'status':false,"message":"Auth header is missing"});

      return;
    }

    // verify  auth token
    const token = header.split("Bearer ")[1] || header;

    if (!token) {
      res.json({'status':false,"message":"Auth token is missing"});
     
      return;
    }

    const userId = verifyJwtToken(token, next);

    if (!userId) {
      res.json({'status':false,"message":"incorrect token"});
      return;
    }

    // const user = await clientModel.findById(userId);
   var sql = "select * from users where id = '"+userId+"'";
          dbConnection.query(sql, function (err, user) {
          if (!user) {
      res.json({'status':false,"message":"User not found"});
          
            return;
          }else{
            res.user = user;
            next();
          }
      });
 


  } catch (err) {
    next(err);
  }
};
