import nodemailer from "nodemailer";

//nodemail credential
var transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 25,
  auth: {
    user: "weclea2023@gmail.com",
    pass: "gugp jorx avii pnkv"
  }
});

export default transport;