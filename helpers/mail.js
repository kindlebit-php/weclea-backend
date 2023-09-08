import nodemailer from "nodemailer";

//nodemail credential
var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "1318c776b0e0a6",
    pass: "e5a0badddf664c"
  }
});

export default transport;