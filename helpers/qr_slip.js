import dbConnection from "../config/db.js";
import { PDFDocument, rgb } from "pdf-lib";
import qrcode from "qrcode";
import { promises as fsPromises } from "fs";

export const qr_slip = async (req, res) => {
  try {
    const booking_id = req.body.booking_id;
    const userIdQuery = `SELECT user_id, order_status FROM bookings WHERE id = ?`;
    dbConnection.query(userIdQuery, [booking_id], async (error, data) => {
      if (error) {
        console.error("Error:", error);
        return;
      }
      if (data && data.length > 0) {
        const userId = data[0].user_id;
        const query = `
          SELECT bq.qr_code AS QR_code, b.order_id, b.date,
          CONCAT(ca.address, ', ', ca.appartment, ', ', ca.city, ', ', ca.state, ', ', ca.zip, ', ', ca.latitude, ', ', ca.longitude) AS address
          FROM bookings AS b
          JOIN customer_address AS ca ON b.user_id = ca.user_id
          JOIN users AS u ON b.user_id = u.id
          JOIN booking_qr AS bq ON b.id = bq.booking_id
          WHERE b.user_id = ? AND b.id = ? `;

        dbConnection.query(
          query,
          [userId, booking_id],
          async (error, data2) => {
            if (error) {
              console.error("Error:", error);
              return;
            }
            if (data2 && data2.length > 0) {
              const qr_code = data2[0].QR_code;
              const qrCode = await generateQRCode(qr_code);

              
              if (!qrCode.startsWith("data:image/png;base64,")) {
                console.error("Invalid QR code format.");
                return;
              }

             
              const pdfDoc = await PDFDocument.create();
              const page = pdfDoc.addPage([600, 400]);
              const { width, height } = page.getSize();

              
              const qrCodeImageData = qrCode.split("data:image/png;base64,")[1];

              
              const qrCodeImage = await pdfDoc.embedPng(
                Buffer.from(qrCodeImageData, "base64")
              );
              page.drawImage(qrCodeImage, {
                x: 50,
                y: height - 200, 
                width: 100,
                height: 100,
              });

              const content = `
                Order ID: ${data2[0].order_id}
                Date: ${data2[0].date}
                Address: ${data2[0].address}
              `;

              page.drawText(content, {
                x: 200,
                y: height - 50, 
                size: 14,
                color: rgb(0, 0, 0),
              });

              // Save the PDF to a file
              const pdfBytes = await pdfDoc.save();

              // Set response headers for download
              res.setHeader("Content-Type", "application/pdf");
              res.setHeader(
                "Content-Disposition",
                'attachment; filename="qr_slip.pdf"'
              );

              
              res.end(pdfBytes);
            }
          }
        );
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
};


async function generateQRCode(qr_code) {
  return new Promise((resolve, reject) => {
    qrcode.toDataURL(qr_code, (err, qrCode) => {
      if (err) {
        console.error("Error generating QR code:", err);
        reject(err);
      }
      resolve(qrCode);
    });
  });
}
