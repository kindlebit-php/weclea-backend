import express from "express";
const router = express.Router();
import userController from "../controllers/UserController.js";
import loadController from "../controllers/LoadController.js";
import bookingController from "../controllers/BookingController.js";
import { CheckAuth } from "../middlewares/checkAuth.js";
import driverController from "../controllers/DriverController.js";
import paymentController from "../controllers/PaymentController.js";
import multer from 'multer';

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
router.post('/customer-loads-subscription',CheckAuth ,loadController.customer_loads_subscription);
router.post('/customer-booking',CheckAuth ,bookingController.customer_booking);
router.get('/get-load-price',CheckAuth ,loadController.get_load_price);
router.post('/customer-login',userController.customer_login);
router.post('/forgot-password',userController.forgot_password);
router.post('/verify-otp',userController.verify_otp);
router.post('/change-password',userController.change_password);
router.get('/get-orders',CheckAuth,driverController.get_orders);
router.get("/get-order-detail",CheckAuth,driverController.get_order_detail);
router.post("/attach-card",CheckAuth,paymentController.Attach_Card);
router.get("/get-all-cards",CheckAuth,paymentController.get_all_cards)
router.post("/customer-payment",CheckAuth,paymentController.customer_payment);
router.post("/Add-Bank-Account",CheckAuth,paymentController.Add_Bank_Account)
router.post("/ACH-Payment",CheckAuth,paymentController.ACH_Payment)

export default router;