import nodemailer from "nodemailer";

//nodemail credential
// var transport = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 25,
//   auth: {
//     user: "weclea2023@gmail.com",
//     pass: "gugp jorx avii pnkv"
//   }
// });
var transport = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: "support@weclea.com",
    pass: "Smarketilikeitweclea.com!"
  }
});

export default transport;