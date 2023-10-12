import dbConnection from "../../config/db.js";
import { date, time } from "../../helpers/date.js";

export const Scan_received_loads = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const qr_code = req.body.qr_code;

  try {
    const verifyQr = "SELECT * FROM booking_qr WHERE  qr_code = ?";
    dbConnection.query(verifyQr, [qr_code], function (error, data) {
      console.log(data);
      if (error) {
        return res.json({ status: false, message: error.message });
      } else if (
        data.length > 0 &&
        data[0].driver_pickup_status == "1" &&
        data[0].folder_recive_status == "0"
      ) {
        const updateStatus = `UPDATE booking_qr SET folder_recive_status = '1' WHERE id = ${data[0].id}`;
        dbConnection.query(updateStatus, function (updateerror, updateResult) {
          if (updateerror) {
            return res.json({ status: false, message: updateerror.message });
          } else if (updateResult.affectedRows === 1) {
            const currentTime = time();
            const currentDate = date();
            const wash_scan_timing = `${currentDate} ${currentTime}`;
            console.log(data[0].booking_id);
            const update_Date_Time = `UPDATE booking_timing SET wash_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
            dbConnection.query(
              update_Date_Time,
              function (updateTimeErr, updateTimeResult) {
                console.log(updateTimeResult);
                console.log(updateTimeErr);
                if (updateTimeErr) {
                  return res.json({
                    status: false,
                    message: updateTimeErr.message,
                  });
                } else if (updateTimeResult.affectedRows === 1) {
                  const updateBooking = `UPDATE bookings SET folder_id = ${folder_id} WHERE id = ${data[0].booking_id}`;
                  dbConnection.query(
                    updateBooking,
                    function (updateBookingErr, updateBookingResult) {
                      if (updateBookingErr) {
                        return res.json({
                          status: false,
                          message: updateBookingErr.message,
                        });
                      } else if (updateBookingResult.affectedRows === 1) {
                        return res.json({
                          status: true,
                          message: "Verified successfully!",
                        });
                      } else {
                        return res.json({
                          status: false,
                          message: "Invalid folder_id",
                        });
                      }
                    }
                  );
                } else {
                  return res.json({
                    status: false,
                    message: "Failed to update timing",
                  });
                }
              }
            );
          } else {
            return res.json({ status: false, message: "Invalid qr_code!" });
          }
        });
      } else {
        return res.json({ status: false, message: "Invalid qr_code!!" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const customer_list_wash = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;

  try {
    const bookingIdQuery = `SELECT id FROM bookings WHERE folder_id = ?`;
    dbConnection.query(bookingIdQuery, [folder_id], (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      if (userIdResult.length === 0) {
        return res.json({ status: false, message: "User has no bookings" });
      }
      const booking_id = userIdResult.map((row) => row.id);
      const query = `SELECT b.user_id AS Customer_Id, b.date, b.time, b.order_status, bi.pickup_images
                      FROM bookings AS b
                      JOIN booking_images AS bi ON b.id = bi.booking_id
                      WHERE b.id IN (?)`;
      dbConnection.query(query, [booking_id], (error, data) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        } else if (data.length === 0) {
          return res.json({ status: false, message: "Data not found" });
        } else {
          const resData = [];
          if (data?.length > 0) {
            for (const elem of data) {
              console.log("ksjfhg",data);
              const { Customer_Id, date, time, order_status, pickup_images } = elem;

              console.log('images',pickup_images)
              const separatedStrings = pickup_images.split(", ")
               const imagesUrl=separatedStrings.map((val) => {
               return `${process.env.BASE_URL}/${val}`;
              });

              resData.push({
                Customer_Id,
                date,
                time,
                order_status,
                imagesUrl,
              });
            }
          }
          return res.json({
            status: true,
            message: "Updated successfully!",
            data: resData,
          });
        }
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const wash_detail_ByCustomer_id = async (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const customer_id = req.body.customer_id;
  try {
    const bookingIdQuery = `SELECT id FROM bookings WHERE folder_id = ?`;
    dbConnection.query(bookingIdQuery, [folder_id], (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      if (userIdResult.length === 0) {
        return res.json({ status: false, message: "User has no bookings" });
      }
      const booking_id = userIdResult.map((row) => row.id);
      const query = `SELECT b.user_id AS Customer_Id, b.date, b.time, b.order_status, bi.pickup_images
                        FROM bookings AS b
                        JOIN booking_images AS bi ON b.id = bi.booking_id
                        WHERE b.user_id = ? AND b.id IN (?)`;
      dbConnection.query(query, [customer_id, booking_id], (error, data) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        } else if (data.length === 0) {
          return res.json({ status: false, message: "Data not found" });
        } else {
          const resData = [];
          if (data?.length > 0) {
            for (const elem of data) {
              const { Customer_Id, date, time, order_status, pickup_images } =
                elem;
              const separatedStrings = pickup_images.split(", ")
               const imagesUrl=separatedStrings.map((val) => {
               return `${process.env.BASE_URL}/${val}`;
              });

              resData.push(
                Customer_Id,
                date,
                time,
                order_status,
                imagesUrl,
            );
            }
          }
          return res.json({
            status: true,
            message: "Updated successfully!",
            data: resData[0],
          });
        }
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const submit_wash_detail = async (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const { booking_id } = req.body;

  try {
    const userIdQuery = "SELECT user_id FROM bookings WHERE id = ?";

    dbConnection.query(userIdQuery, [booking_id], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      const currentTime = time();
      const currentDate = date();
      const updateDateTimeQuery = `UPDATE booking_timing SET wash_time = ?, wash_date = ? WHERE booking_id = ?`;

      dbConnection.query(
        updateDateTimeQuery,
        [currentTime, currentDate, booking_id],
        function (updateTimeErr, updateTimeResult) {
          if (updateTimeErr) {
            return res.json({ status: false, message: updateTimeErr.message });
          }

          const imageArray = [];
          req.files.forEach((e, i) => {
            imageArray.push(e.path);
          });

          if (req.files.length > 5) {
            return res.json({
              status: false,
              message: "only 5 images are allowed",
            });
          }
          const pickupImagesJSON = imageArray.join(", ");
          const updatePickupImagesQuery =
            "UPDATE booking_images SET wash_images = ? WHERE booking_id = ?";

          dbConnection.query(
            updatePickupImagesQuery,
            [pickupImagesJSON, booking_id],
            function (updateImagesErr, updateImagesResult) {
              if (updateImagesErr) {
                return res.json({
                  status: false,
                  message: updateImagesErr.message,
                });
              }

              const updateOrderStatusQuery =
                "UPDATE bookings SET order_status = ? WHERE id = ?";

              dbConnection.query(
                updateOrderStatusQuery,
                ["1", booking_id],
                function (updateOrderStatusErr, updateOrderStatusResult) {
                  if (updateOrderStatusErr) {
                    return res.json({
                      status: false,
                      message: updateOrderStatusErr.message,
                    });
                  }

                  const responseData = {
                    status: true,
                    message:
                      "Wash process is completed! Please go to the next step",
                    data: {
                      customer_id: data[0].user_id,
                    },
                  };

                  return res.json(responseData);
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const Scan_loads_For_Dry = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const qr_code = req.body.qr_code;

  try {
    const verifyQr = "SELECT * FROM booking_qr WHERE qr_code = ?";
    dbConnection.query(verifyQr, [qr_code], function (error, data) {
      console.log("retyyyouiygtik", data[0].folder_recive_status);
      if (error) {
        return res.json({ status: false, message: error.message });
      } else if (data[0].folder_recive_status == "1") {
        const verifyStatus = `SELECT * FROM bookings WHERE order_status = '1' AND id = ${data[0].booking_id}`;
        dbConnection.query(verifyStatus, function (verifyerror, verifyResult) {
          if (verifyerror) {
            return res.json({ status: false, message: verifyerror.message });
          } else if (verifyResult.length > 0) {
            const currentTime = time();
            const currentDate = date();
            const dry_scan_timing = `${currentDate} ${currentTime}`;
            const update_Date_Time = `UPDATE booking_timing SET dry_scan_timing = '${dry_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
            dbConnection.query(
              update_Date_Time,
              function (updateTimeErr, updateTimeResult) {
                console.log(updateTimeResult);
                console.log(updateTimeErr);
                if (updateTimeErr) {
                  return res.json({
                    status: false,
                    message: updateTimeErr.message,
                  });
                } else if (updateTimeResult.affectedRows === 1) {
                  return res.json({
                    status: true,
                    message: "Verified successfully!",
                  });
                } else {
                  return res.json({
                    status: false,
                    message: "Failed to update timing",
                  });
                }
              }
            );
          } else {
            return res.json({ status: false, message: "Invalid qr_code!" });
          }
        });
      } else {
        return res.json({ status: false, message: "Invalid qr_code!" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const submit_dry_detail = async (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const { booking_id } = req.body;

  try {
    const userIdQuery = "SELECT user_id FROM bookings WHERE id = ?";

    dbConnection.query(userIdQuery, [booking_id], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      const currentTime = time();
      const currentDate = date();
      const updateDateTimeQuery = `UPDATE booking_timing SET dry_time = ?, dry_date = ? WHERE booking_id = ?`;

      dbConnection.query(
        updateDateTimeQuery,
        [currentTime, currentDate, booking_id],
        function (updateTimeErr, updateTimeResult) {
          if (updateTimeErr) {
            return res.json({ status: false, message: updateTimeErr.message });
          }

          const imageArray = [];
          req.files.forEach((e, i) => {
            imageArray.push(e.path);
          });

          if (req.files.length > 5) {
            return res.json({
              status: false,
              message: "only 5 images are allowed",
            });
          }
          const pickupImagesJSON = imageArray.join(", ");
          const updatePickupImagesQuery =
            "UPDATE booking_images SET dry_images = ? WHERE booking_id = ?";

          dbConnection.query(
            updatePickupImagesQuery,
            [pickupImagesJSON, booking_id],
            function (updateImagesErr, updateImagesResult) {
              if (updateImagesErr) {
                return res.json({
                  status: false,
                  message: updateImagesErr.message,
                });
              }

              const updateOrderStatusQuery =
                "UPDATE bookings SET order_status = ? WHERE id = ?";

              dbConnection.query(
                updateOrderStatusQuery,
                ["2", booking_id],
                function (updateOrderStatusErr, updateOrderStatusResult) {
                  if (updateOrderStatusErr) {
                    return res.json({
                      status: false,
                      message: updateOrderStatusErr.message,
                    });
                  }

                  const responseData = {
                    status: true,
                    message:
                      "Dry process is completed! Please go to the next step",
                    data: {
                      customer_id: data[0].user_id,
                    },
                  };

                  return res.json(responseData);
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const Scan_loads_For_Fold = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const qr_code = req.body.qr_code;

  try {
    const verifyQr = "SELECT * FROM booking_qr WHERE qr_code = ?";
    dbConnection.query(verifyQr, [qr_code], function (error, data) {
      console.log("retyyyouiygtik", data[0].folder_recive_status);
      if (error) {
        return res.json({ status: false, message: error.message });
      } else if (data[0].folder_recive_status == "1") {
        const verifyStatus = `SELECT * FROM bookings WHERE order_status = '2' AND id = ${data[0].booking_id}`;
        dbConnection.query(verifyStatus, function (verifyerror, verifyResult) {
          if (verifyerror) {
            return res.json({ status: false, message: verifyerror.message });
          } else if (verifyResult.length > 0) {
            const currentTime = time();
            const currentDate = date();
            const fold_scan_timing = `${currentDate} ${currentTime}`;
            const update_Date_Time = `UPDATE booking_timing SET fold_scan_timing = '${fold_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
            dbConnection.query(
              update_Date_Time,
              function (updateTimeErr, updateTimeResult) {
                console.log(updateTimeResult);
                console.log(updateTimeErr);
                if (updateTimeErr) {
                  return res.json({
                    status: false,
                    message: updateTimeErr.message,
                  });
                } else if (updateTimeResult.affectedRows === 1) {
                  return res.json({
                    status: true,
                    message: "Verified successfully!",
                  });
                } else {
                  return res.json({
                    status: false,
                    message: "Failed to update timing",
                  });
                }
              }
            );
          } else {
            return res.json({ status: false, message: "Invalid qr_code!" });
          }
        });
      } else {
        return res.json({ status: false, message: "Invalid qr_code!" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const submit_fold_detail = async (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const { booking_id } = req.body;

  try {
    const userIdQuery = "SELECT user_id FROM bookings WHERE id = ?";

    dbConnection.query(userIdQuery, [booking_id], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      const currentTime = time();
      const currentDate = date();
      const updateDateTimeQuery = `UPDATE booking_timing SET fold_time = ?, fold_date = ? WHERE booking_id = ?`;

      dbConnection.query(
        updateDateTimeQuery,
        [currentTime, currentDate, booking_id],
        function (updateTimeErr, updateTimeResult) {
          if (updateTimeErr) {
            return res.json({ status: false, message: updateTimeErr.message });
          }

          const imageArray = [];
          req.files.forEach((e, i) => {
            imageArray.push(e.path);
          });

          if (req.files.length > 5) {
            return res.json({
              status: false,
              message: "only 5 images are allowed",
            });
          }
          const pickupImagesJSON = imageArray.join(", ");
          const updatePickupImagesQuery =
            "UPDATE booking_images SET fold_images = ? WHERE booking_id = ?";

          dbConnection.query(
            updatePickupImagesQuery,
            [pickupImagesJSON, booking_id],
            function (updateImagesErr, updateImagesResult) {
              if (updateImagesErr) {
                return res.json({
                  status: false,
                  message: updateImagesErr.message,
                });
              }

              const updateOrderStatusQuery =
                "UPDATE bookings SET order_status = ? WHERE id = ?";

              dbConnection.query(
                updateOrderStatusQuery,
                ["3", booking_id],
                function (updateOrderStatusErr, updateOrderStatusResult) {
                  if (updateOrderStatusErr) {
                    return res.json({
                      status: false,
                      message: updateOrderStatusErr.message,
                    });
                  }

                  const responseData = {
                    status: true,
                    message:
                      "Fold process is completed! Please go to the next step",
                    data: {
                      customer_id: data[0].user_id,
                    },
                  };

                  return res.json(responseData);
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const Scan_loads_For_Pack = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const qr_code = req.body.qr_code;
  try {
    const verifyQr = "SELECT * FROM booking_qr WHERE qr_code = ?";
    dbConnection.query(verifyQr, [qr_code], function (error, data) {
      console.log("retyyyouiygtik", data[0].folder_recive_status);
      if (error) {
        return res.json({ status: false, message: error.message });
      } else if (data[0].folder_recive_status == "1") {
        const verifyStatus = `SELECT * FROM bookings WHERE order_status = '3' AND id = ${data[0].booking_id}`;
        dbConnection.query(verifyStatus, function (verifyerror, verifyResult) {
          if (verifyerror) {
            return res.json({ status: false, message: verifyerror.message });
          } else if (verifyResult.length > 0) {
            const currentTime = time();
            const currentDate = date();
            const pack_scan_timing = `${currentDate} ${currentTime}`;
            const update_Date_Time = `UPDATE booking_timing SET pack_scan_timing = '${pack_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
            dbConnection.query(
              update_Date_Time,
              function (updateTimeErr, updateTimeResult) {
                console.log(updateTimeResult);
                console.log(updateTimeErr);
                if (updateTimeErr) {
                  return res.json({
                    status: false,
                    message: updateTimeErr.message,
                  });
                } else if (updateTimeResult.affectedRows === 1) {
                  return res.json({
                    status: true,
                    message: "Verified successfully!",
                  });
                } else {
                  return res.json({
                    status: false,
                    message: "Failed to update timing",
                  });
                }
              }
            );
          } else {
            return res.json({ status: false, message: "Invalid qr_code!" });
          }
        });
      } else {
        return res.json({ status: false, message: "Invalid qr_code!" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const order_histroy = async (req, res) => {
  try {
    const userData = res.user;
    const folder_id = userData[0].id;
    const userIdQuery = `
            SELECT  b1.id,b1.user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.folder_id
            WHERE u.id = ?`;
    dbConnection.query(
      userIdQuery,
      [folder_id],
      async (error, userIdResult) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        const userIds = userIdResult.map((row) => row.user_id);
        const bookingIds = userIdResult.map((row) => row.id);

        console.log(userIds, bookingIds, folder_id);
        const query = ` SELECT  b.user_id AS Customer_Id, CONCAT(b.date, ' ', b.time) AS PickUp_date_time ,bi.pack_images
      FROM bookings AS b
      JOIN users AS u ON b.user_id = u.id
      JOIN booking_images AS bi ON b.id = bi.booking_id 
      WHERE  b.order_status = '4' AND b.folder_id = ? AND b.user_id IN (?) AND b.id IN (?)
        ORDER BY PickUp_date_time DESC`;

        dbConnection.query(
          query,
          [folder_id, userIds, bookingIds],
          (error, data) => {
            console.log(data);
            if (error) {
              return res.json({ status: false, message: error.message });
            } else if (data.length < 0) {
              return res.json({ status: false, message: "data not found" });
            } else {
              const resData = [];
              const imageArray = [];
              if (data?.length > 0) {
                for (const elem of data) {
                  const { Customer_Id, PickUp_date_time, pack_images } = elem;
                  for (const image of pack_images) {
                    imageArray.push({
                      img_path: image ? `${process.env.HTTPURL}${image}` : "",
                    });
                  }
                  resData.push({
                    Customer_Id,
                    PickUp_date_time,
                    imageArray,
                  });
                }
              }
              return res.json({
                status: true,
                message: "Updated successfully!",
                data: resData,
              });
            }
          }
        );
      }
    );
  } catch (error) {
    console.log(error.message);
    res.json({ status: false, message: error.message });
  }
};

export const Filter_order_histroy = async (req, res) => {
  try {
    const userData = res.user;
    const folder_id = userData[0].id;
    const userIdQuery = `
            SELECT  b1.id,b1.user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.folder_id
            WHERE u.id = ?`;
    dbConnection.query(
      userIdQuery,
      [folder_id],
      async (error, userIdResult) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        const userIds = userIdResult.map((row) => row.user_id);
        const bookingIds = userIdResult.map((row) => row.id);

        console.log(userIds, bookingIds, folder_id);
        const query = ` SELECT  b.user_id AS Customer_Id, CONCAT(b.date, ' ', b.time) AS PickUp_date_time ,bi.pack_images
      FROM bookings AS b
      JOIN users AS u ON b.user_id = u.id
      JOIN booking_images AS bi ON b.id = bi.booking_id 
      WHERE  b.order_status = '4' AND b.folder_id = ? AND b.user_id IN (?) AND b.id IN (?)
        ORDER BY PickUp_date_time DESC`;

        dbConnection.query(
          query,
          [folder_id, userIds, bookingIds],
          (error, data) => {
            console.log(data);
            if (error) {
              return res.json({ status: false, message: error.message });
            } else if (data.length < 0) {
              return res.json({ status: false, message: "data not found" });
            } else {
              const resData = [];
              const imageArray = [];
              if (data?.length > 0) {
                for (const elem of data) {
                  const { Customer_Id, PickUp_date_time, pack_images } = elem;
                  for (const image of pack_images) {
                    imageArray.push({
                      img_path: image ? `${process.env.HTTPURL}${image}` : "",
                    });
                  }
                  resData.push({
                    Customer_Id,
                    PickUp_date_time,
                    imageArray,
                  });
                }
              }
              return res.json({
                status: true,
                message: "data retrived  successfully!",
                data: resData,
              });
            }
          }
        );
      }
    );
  } catch (error) {
    console.log(error.message);
    res.json({ status: false, message: error.message });
  }
};

export const order_histroy_detail= async(req,res)=>{
  try {
    const userData = res.user;
    const folder_id = userData[0].id;
    const order_id=req.body.order_id;
    const userIdQuery = `
            SELECT  b1.id,b1.user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.folder_id
            WHERE u.id = ?`;
    dbConnection.query(
      userIdQuery,
      [folder_id],
      async (error, userIdResult) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        const userIds = userIdResult.map((row) => row.user_id);
        const bookingIds = userIdResult.map((row) => row.id);

        console.log(userIds, bookingIds, folder_id);
        const query = ` SELECT  b.user_id AS Customer_Id, CONCAT(b.date, ' ', b.time) AS PickUp_date_time ,bi.pack_images
      FROM bookings AS b
      JOIN users AS u ON b.user_id = u.id
      JOIN booking_images AS bi ON b.id = bi.booking_id 
      WHERE  b.order_status = '4' AND b.folder_id = ? AND b.user_id IN (?) AND b.id IN (?)
        ORDER BY PickUp_date_time DESC`;

        dbConnection.query(
          query,
          [folder_id, userIds, bookingIds],
          (error, data) => {
            console.log(data);
            if (error) {
              return res.json({ status: false, message: error.message });
            } else if (data.length < 0) {
              return res.json({ status: false, message: "data not found" });
            } else {
              const resData = [];
              const imageArray = [];
              if (data?.length > 0) {
                for (const elem of data) {
                  const { Customer_Id, PickUp_date_time, pack_images } = elem;
                  for (const image of pack_images) {
                    imageArray.push({
                      img_path: image ? `${process.env.HTTPURL}${image}` : "",
                    });
                  }
                  resData.push({
                    Customer_Id,
                    PickUp_date_time,
                    imageArray,
                  });
                }
              }
              return res.json({
                status: true,
                message: "Updated successfully!",
                data: resData,
              });
            }
          }
        );
      }
    );
  }  catch (error) {
    console.log(error.message);
    res.json({ status: false, message: error.message });
  }
}

export default {
  Scan_received_loads,
  customer_list_wash,
  wash_detail_ByCustomer_id,
  submit_wash_detail,
  Scan_loads_For_Dry,
  submit_dry_detail,
  Scan_loads_For_Fold,
  submit_fold_detail,
  Scan_loads_For_Pack,
  order_histroy,
  Filter_order_histroy,
};
