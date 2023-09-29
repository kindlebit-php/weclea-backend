import express from "express";
const router = express.Router();
import userController from "../controllers/UserController.js";
import loadController from "../controllers/LoadController.js";
import bookingController from "../controllers/BookingController.js";
import { CheckAuth } from "../middlewares/checkAuth.js";
import driverController from "../controllers/DriverController.js";
import paymentController from "../controllers/PaymentController.js";
import cronController from "../controllers/CronController.js";
import multer from 'multer';
import { upload } from "../utils/multer.js";

const storage = multer.diskStorage({
    destination: function(req, file, cb)
    {
        cb(null, 'uploads');
    },   
    filename: function (req, file, cb) 
    {
      cb(null,file.originalname)
    }
});

const profileUpload = multer({storage:storage})

router.post('/customer-register',userController.customer_register);
router.post('/customer-address',CheckAuth ,userController.customer_address);
router.post('/customer-drop-address',CheckAuth ,userController.customer_drop_address);
router.post('/edit-user-profile',CheckAuth,profileUpload.single('profile_image') ,userController.edit_user_profile);
router.post('/customer-billing-address',CheckAuth ,userController.customer_billing_address);
router.get('/get-loads' ,CheckAuth, loadController.get_loads);
router.get('/get-user-profile' ,CheckAuth,userController.get_user_profile);
router.get('/get-user-loads',CheckAuth ,loadController.get_user_loads);
router.get('/get-user-subscription',CheckAuth ,loadController.get_user_subscription);
router.post('/customer-loads-subscription',CheckAuth ,loadController.customer_loads_subscription);
router.post('/customer-booking',CheckAuth ,bookingController.customer_booking);
router.get('/get-load-price',CheckAuth ,loadController.get_load_price);
router.post('/customer-login',userController.customer_login);
router.post('/forgot-password',userController.forgot_password);
router.post('/verify-otp',userController.verify_otp);
router.post('/change-password',userController.change_password);
router.get('/get-orders',CheckAuth,driverController.get_orders);
router.get("/get-order-detail",CheckAuth,driverController.get_order_detail);
router.post("/pickup-loads",CheckAuth,driverController.pickup_loads)
router.get("/pickup-loads-detail",CheckAuth,driverController.pickup_loads_detail);
router.post("/submit_pickup_details",CheckAuth,upload.array("images", 5),driverController.submit_pickup_details);
router.post("/laundry-NotFound",CheckAuth,upload.array("images", 5),driverController.laundry_NotFound);
router.get("/order-histroy",CheckAuth,driverController.order_histroy);
router.get("/order-histroy-byOrderId",CheckAuth,driverController.order_histroy_byOrderId);
router.get("/profile",CheckAuth,driverController.profile)
router.get("/get-drop-orders",CheckAuth,driverController.get_drop_orders)
router.get("/get-drop-order-detail",CheckAuth,driverController.get_drop_order_detail);
router.post("/drop-loads",CheckAuth,driverController.drop_loads)
router.get("/drop-loads-detail",CheckAuth,driverController.drop_loads_detail);
router.post("/submit_drop_details",CheckAuth,upload.array("images", 5),driverController.submit_drop_details);
router.get("/booking-subscription-cron",cronController.booking_subscription_cron);
router.post("/attach-card",CheckAuth,paymentController.Attach_Card);
router.get("/get-all-cards",CheckAuth,paymentController.get_all_cards);
router.post("/Payment-Card-Id",CheckAuth,paymentController.Payment_Card_Id);
router.post("/customer-payment",CheckAuth,paymentController.customer_payment);
router.post("/Add-Bank-Account",CheckAuth,paymentController.Add_Bank_Account);
router.post("/ACH-Payment",CheckAuth,paymentController.ACH_Payment);
export default router;