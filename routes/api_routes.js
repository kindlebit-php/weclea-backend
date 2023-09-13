import express from "express";
const router = express.Router();
import userController from "../controllers/UserController.js";
import loadController from "../controllers/LoadController.js";
import bookingController from "../controllers/BookingController.js";
import { CheckAuth } from "../middlewares/checkAuth.js";
import driverController from "../controllers/DriverController.js";
import paymentController from "../controllers/PaymentController.js";

router.post('/customer-register',userController.customer_register);
router.post('/customer-address',CheckAuth ,userController.customer_address);
router.post('/customer-drop-address',CheckAuth ,userController.customer_drop_address);
router.post('/customer-billing-address',CheckAuth ,userController.customer_billing_address);
router.get('/get-loads',CheckAuth ,loadController.get_loads);
router.post('/customer-loads-subscription',CheckAuth ,loadController.customer_loads_subscription);
router.post('/customer-booking',CheckAuth ,bookingController.customer_booking);
router.post('/get-load-price',CheckAuth ,loadController.get_load_price);
router.post('/customer-login',userController.customer_login);
router.post('/forgot-password',userController.forgot_password);
router.post('/verify-otp',userController.verify_otp);
router.post('/change-password',userController.change_password);
router.get('/get-orders',CheckAuth,driverController.get_orders);
router.get("/get-order-detail",CheckAuth,driverController.get_order_detail);
router.post("/attach-card",CheckAuth,paymentController.Attach_Card);
router.post("/customer-payment",CheckAuth,paymentController.customer_payment)


export default router;