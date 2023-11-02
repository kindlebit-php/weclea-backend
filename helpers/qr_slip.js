import dbConnection from "../config/db.js";
import qrcode from "qrcode";
import { v4 as uuidv4 } from 'uuid'; 
import pdf from "pdf-creator-node"; 
import path from "path";

export const qr_slip = async (req, res) => {
    try {
      const booking_id = req.body.booking_id;
      console.log(booking_id);
  
      const userData = await getUserData(booking_id);
      if (!userData) {
        return res.status(404).send("Booking not found");
      }
  
      const qrCode = await generateQRCode(userData.QR_code);
  
      if (!qrCode.startsWith("data:image/png;base64,")) {
        return res.status(500).send("Invalid QR code format");
      }
      console.log(qrCode)
      const pdfBytes = await generatePDF(userData, qrCode);
      return res.end(pdfBytes)
  
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("An error occurred");
    }
  };


export const getUserData=async(booking_id)=>{
  return new Promise((resolve, reject) => {
    const userIdQuery = `SELECT user_id, order_status FROM bookings WHERE id = ?`;
    dbConnection.query(userIdQuery, [booking_id], (error, data) => {
      if (error) {
        reject(error);
      }
      if (data && data.length > 0) {
        const userId = data[0].user_id;
        const query = `
          SELECT  b.order_id, b.date,
          CONCAT(ca.address, ', ', ca.appartment, ', ', ca.city, ', ', ca.state, ', ', ca.zip) AS address
          FROM bookings AS b
          JOIN customer_address AS ca ON b.user_id = ca.user_id
          JOIN users AS u ON b.user_id = u.id
          WHERE b.user_id = ? AND b.id = ? `;
        
        dbConnection.query(query, [userId, booking_id], (error, data2) => {
          if (error) {
            reject(error);
          }
          if (data2 && data2.length > 0) {
            resolve(data2[0]);
          }
        });
      } else {
        resolve(null); 
      }
    });
  });
}

export const generatePDF= async(data, qrCode)=> {
    const order_id=data.order_id;
    const date=data.date;
    const address=data.address;
    const qrCodeImageData = qrCode.split('data:image/png;base64,')[1];
  
    const options = {
      format: 'A4',
      orientation: 'portrait',
      header: {
        height: '0mm',
      },
      footer: {
        height: '0mm',
      },
      type: 'pdf',
    };
  
     const document = {
        html: `<!DOCTYPE html>
            <head>
            <link href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@400;700&display=swap" rel="stylesheet">
            </head>
            <html>
                <body style="background: #dfdfdf;">
                    <div style="margin:0 auto;font-family: 'Lexend Deca', sans-serif;width: 375px;background: #ffffff;padding: 0px;display: flex;align-items: start;justify-content: space-between;flex-wrap:wrap;">
                        <table class="table" style="border-collapse: collapse;width:100%;display: table;">
                            <thead>
                                <tr>
                                    <th scope="col" style="padding: 15px 5px;border-bottom: 1px solid #ccc;text-align: center;width: 20%;border-right: 1px solid #ccc;"><img src="https://api.weclea.com/uploads/logo.png" style="width: 70%;"> </th>
                                    <th scope="col" style="font-size: 14px;font-weight: 600;padding: 15px 15px;width: 50%;text-align: left;border-bottom: 1px solid #ccc;">
                                        <p style="margin: 0 0 8px;display: flex;justify-content: space-between;align-items: center;font-weight: 600;">Invoice # <span>${order_id}</span></p>
                                        <p style="margin: 0;display: flex;justify-content: space-between;align-items: center;font-weight: 600;">Issue Date <span>${date}</span></p>
                                    </th>
                                </tr>
                            </thead>
                        </table>
                        <table class="table" style="border-collapse: collapse;width:100%;display: table;">
                            <thead>
                                <tr>
                                    <td colspan="3" style="color: #212121;padding: 15px 15px;font-size: 14px;border-bottom: 1px solid #ccc;font-weight: 600;">Pickup Address <p style="font-size: 14px;margin: 8px 0 0;font-weight: 500;color: #4a4a4a;">${address}</p></td>
                                </tr>
                                <tr>
                                    <th scope="col" style="font-size: 14px;font-weight: 600;padding: 15px 15px;width: 50%;text-align: left;border-bottom: 1px solid #ccc;">
                                        <p style="margin: 0 0 8px;display: flex;justify-content: space-between;align-items: center;font-weight: 600;">Contact:</p>
                                        <p style="margin: 0 0 5px;display: flex;justify-content: space-between;align-items: center;font-weight: 500;color: #4a4a4a;">Weclea</p>
                                        <p style="margin: 0 0 5px;display: flex;justify-content: space-between;align-items: center;font-weight: 500;color: #4a4a4a;">hello@weclea.com</p>
                                        <p style="margin: 0 0 5px;display: flex;justify-content: space-between;align-items: center;font-weight: 500;color: #4a4a4a;">(123) 456-7890</p>
                                    </th>
                                    <th scope="col" style="padding: 0px 0px 0px;border-bottom: 1px solid #ccc;text-align: center;width: 20%;border-right: 1px solid #ccc;"><img src="data:image/png;base64, ${qrCodeImageData}" style="width: 80%;"> </th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                </body>

            </html>`,
        data: {
            qrCodeImage: 'data:image/png;base64,' + qrCodeImageData,
        },
        path: `uploads/${uuidv4()}.pdf`,
    };
  
    const pdfPromise = new Promise((resolve, reject) => {
      pdf.create(document, options)
        .then((res) => {
          resolve(res.filename);
          console.log('filename',filename)
        })
        .catch((error) => {
          console.log('error',error)
          reject(error);
        });
    });
    return pdfPromise;
}


export const generateQRCode= async(qr_code)=>
{
  return new Promise((resolve, reject) => {
    qrcode.toDataURL(qr_code, (err, qrCode) => {
      if (err) {
        reject(err);
      }
      resolve(qrCode);
    });
  });
}
