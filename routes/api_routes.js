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
import { uploadS3 } from "../utils/multerS3.js";

import DrycleanController from "../controllers/DrycleanController.js";
import FolderController from "../controllers/Folder/FolderController.js";
import { qr_slip } from "../helpers/qr_slip.js";
import { checkPrimeSync } from "crypto";


router.post('/customer-register',userController.customer_register);
router.post('/order-managament-user-singup',uploadS3.fields([{ name: "licence_front_image", maxCount: 1 },{ name: "licence_back_image", maxCount: 1 },{ name: "profile_image", maxCount: 1 },]),userController.order_managament_user_singup);
router.post('/order-managament-user-update',uploadS3.fields([{ name: "licence_front_image", maxCount: 1 },{ name: "licence_back_image", maxCount: 1 },{ name: "profile_image", maxCount: 1 },]),userController.order_managament_user_update);
router.post('/delete-employee',userController.delete_employee);
router.post('/newsletter',userController.newsletter);
router.post('/register-employee',userController.register_employee);
router.post('/contact-us',userController.contact_us);
router.post('/update-employee',userController.update_employee);
router.post('/update-user-status',userController.update_user_status);
router.post('/customer-address',CheckAuth ,userController.customer_address);
router.get('/user-registered-address',CheckAuth ,userController.user_registered_address);
router.get('/get-notification',CheckAuth ,userController.get_notification);
router.post('/update-password',CheckAuth ,userController.update_password);
router.post('/edit-user-profile',CheckAuth,uploadS3.single('profile_image') ,userController.edit_user_profile);
router.get("/driver-list",userController.driver_list)
router.post("/driver-data",userController.driver_data)
router.post("/folder-data",userController.folder_data)
router.get("/customer-list",userController.customer_list)
router.get("/folder-list",userController.folder_list)
router.get("/order-list",userController.order_list)
router.get("/order-list-dry-clean",userController.order_list_dry_clean);
router.get("/order-managament-user-history",userController.order_managament_user_history)
router.post("/pdf-link",CheckAuth,userController.pdf_link)
//ejs-terms
router.get("/terms",async(req,res)=>{
    try {
        res.render('Terms')
    } catch (error) {
        res.json({'status':false,"message":error.message});
    }
})
router.get("/privacy_policy",async(req,res)=>{
    try {
        res.render('PrivacyPolicy')
    } catch (error) {
        res.json({'status':false,"message":error.message});
    }
})
router.get("/delete_account",async(req,res)=>{
    try {
        res.render('Login')
    } catch (error) {
        res.json({'status':false,"message":error.message});
    }
})

router.post('/get-loads' ,CheckAuth, loadController.get_loads);
router.get('/get-user-profile' ,CheckAuth,userController.get_user_profile);
router.get('/get-delivery-instruction' ,CheckAuth,userController.get_deleivery_instruction);
router.post('/get-user-loads',CheckAuth ,loadController.get_user_loads);
router.post('/get-user-home-data',CheckAuth ,loadController.get_user_home_data);
router.get('/get-user-subscription',CheckAuth ,loadController.get_user_subscription);
router.post('/customer-loads-subscription',CheckAuth ,loadController.customer_loads_subscription);
router.post('/customer-booking',CheckAuth ,bookingController.customer_booking);
router.post('/booking-rating',CheckAuth ,bookingController.booking_rating);
router.post('/assign-driver' ,bookingController.assign_driver);
router.post('/assign-folder' ,bookingController.assign_folder);
router.post('/get-rating-details' ,CheckAuth,bookingController.get_rating_details);
router.post('/assign-drop-driver' ,bookingController.assign_drop_driver);
router.post('/delete-booking-date',CheckAuth ,bookingController.delete_booking_date);
router.get('/user-subscription-dates',CheckAuth ,bookingController.subscription_dates);
router.get('/subscription-dates-fre',CheckAuth ,bookingController.subscription_dates_fre);
router.get('/subscription-dates-custom',CheckAuth ,bookingController.subscription_dates_custom);
router.get('/booking-history',CheckAuth ,bookingController.booking_history);
router.get('/booking-tracking-status',CheckAuth ,bookingController.booking_tracking_status);
router.get('/booking-tracking-status-both',CheckAuth ,bookingController.booking_tracking_status_both);
router.post('/booking-tracking-details',CheckAuth ,bookingController.booking_tracking_details);
router.post("/add-bin",CheckAuth,bookingController.add_bin)
router.get('/get-load-price',CheckAuth ,loadController.get_load_price);
router.post('/customer-login',userController.customer_login);
router.post('/generate-token/:id',CheckAuth,userController.generate_token);
router.post('/forgot-password',userController.forgot_password);
router.get('/delete-account',CheckAuth,userController.delete_account);
router.post('/delete-customer-account',userController.delete_customer_account);
router.post('/verify-otp',userController.verify_otp);
router.post('/change-password',userController.change_password);
router.get("/customer-order-histroy",CheckAuth,userController.customer_order_histroy)
router.post("/ss", qr_slip);
//********************************Driver Module**************************************//
router.get('/get-orders',CheckAuth,driverController.get_orders)
router.post("/get-order-detail",CheckAuth,driverController.get_order_detail);
router.post("/print-All-QrCode",CheckAuth,driverController.print_All_QrCode)
router.get("/get-dry-clean-orders",CheckAuth,driverController.get_dry_clean_orders)
router.get("/get-dry-clean-drop-orders",CheckAuth,driverController.get_dry_clean_drop_orders)
router.post("/print-All-Drop-QrCode",CheckAuth,driverController.print_All_Drop_QrCode)
router.post("/pickup-loads",CheckAuth,driverController.pickup_loads)
router.post("/pickup-loads-detail",CheckAuth,driverController.pickup_loads_detail);
router.post("/submit_pickup_details",CheckAuth,uploadS3.array("images", 5),driverController.submit_pickup_details);
router.post("/laundry-NotFound",CheckAuth,uploadS3.array("images", 5),driverController.laundry_NotFound);
router.post("/order-histroy",CheckAuth,driverController.order_histroy);
router.post("/order-histroy-byOrderId",CheckAuth,driverController.order_histroy_byOrderId);
router.get("/profile",CheckAuth,driverController.profile)
router.get("/get-drop-orders",CheckAuth,driverController.get_drop_orders);
router.post("/get-drop-order-detail",CheckAuth,driverController.get_drop_order_detail);
router.post("/drop-loads",CheckAuth,driverController.drop_loads);
router.post("/drop-loads-detail",CheckAuth,driverController.drop_loads_detail);
router.post("/submit_drop_details",CheckAuth,uploadS3.array("images", 5),driverController.submit_drop_details);
//********************************Folder Module**************************************//
router.post("/Scan-received-loads",CheckAuth,FolderController.Scan_received_loads);
router.post("/Scan_loads_folder",CheckAuth,FolderController.Scan_loads_folder);
router.post("/customer-list-wash",CheckAuth,FolderController.customer_list_wash);
router.post("/wash-detail-ByCustomer-id",CheckAuth,FolderController.wash_detail_ByCustomer_id);
router.post("/submit-wash-detail",CheckAuth,uploadS3.fields([{ name: "images", maxCount: 5 },{ name: "extra_loads_images", maxCount: 5 },]),FolderController.submit_wash_detail)
router.post("/print-extra-loads-QrCode",CheckAuth,FolderController.print_extra_loads_QrCode)
router.post("/scanning-extra-loads",CheckAuth,FolderController.scanning_extra_loads)
router.post("/Scan-loads-For-Dry",CheckAuth,FolderController.Scan_loads_For_Dry)
//router.post("/submit-dry-detail",CheckAuth,upload.array("images", 5),FolderController.submit_dry_detail)
router.post("/booking-pickup-instruction",CheckAuth,bookingController.booking_pickup_instruction)
router.post("/booking-delievery-instruction",CheckAuth,bookingController.booking_delievery_instruction)
router.post("/Scan-loads-For-Fold",CheckAuth,FolderController.Scan_loads_For_Fold)
//router.post("/submit-fold-detail",CheckAuth,upload.array("images", 5),FolderController.submit_fold_detail)
router.post("/Scan-loads-For-Pack",CheckAuth,FolderController.Scan_loads_For_Pack)
router.post("/folder-order-histroy",CheckAuth,FolderController.order_histroy);
router.post("/order_histroy_detail",CheckAuth,FolderController.order_histroy_detail)
router.get("/profile",CheckAuth,driverController.profile)

//**********************************************************************************//
router.get("/booking-subscription-cron",cronController.booking_subscription_cron);
router.get("/booking-load-alert",cronController.booking_load_alert);
//*********************************PAYMENT******************************************//
router.post("/attach-card",CheckAuth,paymentController.Attach_Card);
router.get("/get-all-cards",CheckAuth,paymentController.get_all_cards);
router.post("/Payment-Card-Id",CheckAuth,paymentController.Payment_Card_Id);
router.post("/customer-payment",CheckAuth,paymentController.customer_payment);
router.post("/Add-Bank-Account",CheckAuth,paymentController.Add_Bank_Account);
router.post("/ACH-Payment",CheckAuth,paymentController.ACH_Payment);
router.post("/customer-payment-BookingId",CheckAuth,paymentController.customer_payment_BookingId)
router.post("/Payment-CardId-BookingId",CheckAuth,paymentController.Payment_CardId_BookingId)
router.post("/customer-extra-payment",CheckAuth,paymentController.customer_extra_payment)
router.post("/customer-extra-payment-cardId",CheckAuth,paymentController.customer_extra_payment_cardId)
router.post("/load_Subscription",CheckAuth,paymentController.load_Subscription)
router.post("/load-Subscription-cardId",CheckAuth,paymentController.load_Subscription_cardId)
//********************************Module---DryClean*****************************************//
router.get("/get-dry-clean-services",CheckAuth,DrycleanController.get_category)
router.get("/get-cart-item",CheckAuth,DrycleanController.get_cart_items)
router.post("/add-to-cart",CheckAuth,DrycleanController.Add_To_Cart)
router.post("/delete-cart-item",CheckAuth,DrycleanController.delete_cart_item)
router.post("/dry-clean-booking",CheckAuth,DrycleanController.dry_clean_booking)
                     //==============----------============------------//
router.post("/Scan-dryClean-received-loads",CheckAuth,DrycleanController.Scan_dryClean_received_loads)
router.post("/Scan_loads_dry_clean",CheckAuth,DrycleanController.Scan_loads_dry_clean)
router.post("/customer-list-dryClean",CheckAuth,DrycleanController.customer_list_dryClean)
router.post("/submit-dryClean-process-detail",CheckAuth,uploadS3.fields([{ name: "images", maxCount: 5 },{ name: "extra_loads_images", maxCount: 5 },]),DrycleanController.submit_dryClean_process_detail)
router.post("/print-DryClean-extra-loads-QrCode",CheckAuth,DrycleanController.print_DryClean_extra_loads_QrCode)
router.post("/scanning-extra-loads-dryClean",CheckAuth,DrycleanController.scanning_extra_loads_dryClean)
router.post("/order-history-dryClean",CheckAuth,DrycleanController.order_histroy_dryClean);
router.post("/order-histroy-dryClean-detail",CheckAuth,DrycleanController.order_histroy_dryClean_detail)

export default router;