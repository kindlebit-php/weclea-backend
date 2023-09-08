// responseHelper.js

// // create_response
// export const create_response = (res, msg, data) => {
//   res.status(201).json({
//     statusCode: 201,
//     status: true,
//     message: msg,
//     data,
//   });
// };

// // fetch_data response
// export const fetch_data = (data, res) => {
//   res.status(200).json({
//     status: true,
//     message: "Data get successfully!",
//     data: data,
//   });
// };

// // error_response
// export const error_response = (res, msg, statusCode) => {
//   res.status(statusCode).json({
//     statusCode: statusCode,
//     status: false,
//     message: msg,
//   });
// };

// custom_response
export const custom_response = (res, statusData, data) => {
  res.status(statusData.statusCode).json({
    ...statusData,
    [statusData.status ? "data" : "error"]: data,
  });
};