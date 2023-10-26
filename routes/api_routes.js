import express from "express";
const router = express.Router();
import userController from "../controllers/UserController.js";
import loadController from "../controllers/LoadController.js";
import bookingController from "../controllers/BookingController.js";
import { CheckAuth } from "../middlewares/checkAuth.js";
import driverController from "../controllers/DriverController.js";
import paymentController from "../controllers/PaymentController.js";
import cronController from "../controllers/CronController.js";
import AdminController from "../controllers/Admin/AdminController.js";
import multer from 'multer';
import { upload } from "../utils/multer.js";
import DrycleanController from "../controllers/DrycleanController.js";
import FolderController from "../controllers/Folder/FolderController.js";
import { qr_slip } from "../helpers/qr_slip.js";


router.post('/customer-register',userController.customer_register);
router.post('/newsletter',userController.newsletter);
router.post('/register-employee',userController.register_employee);
router.post('/update-employee',userController.update_employee);
router.post('/update-user-status',userController.update_user_status);
router.post('/customer-address',CheckAuth ,userController.customer_address);
router.get('/user-registered-address',CheckAuth ,userController.user_registered_address);
router.get('/get-notification',CheckAuth ,userController.get_notification);
router.post('/update-password',CheckAuth ,userController.update_password);
router.post('/edit-user-profile',CheckAuth,upload.single('profile_image') ,userController.edit_user_profile);
router.get("/driver-list",userController.driver_list)
router.get("/customer-list",userController.customer_list)
router.get("/folder-list",userController.folder_list)
router.get("/order-list",userController.order_list)

router.post('/get-loads' ,CheckAuth, loadController.get_loads);
router.get('/get-user-profile' ,CheckAuth,userController.get_user_profile);
router.post('/get-user-loads',CheckAuth ,loadController.get_user_loads);
router.post('/get-user-home-data',CheckAuth ,loadController.get_user_home_data);
router.get('/get-user-subscription',CheckAuth ,loadController.get_user_subscription);
router.post('/customer-loads-subscription',CheckAuth ,loadController.customer_loads_subscription);
router.post('/customer-booking',CheckAuth ,bookingController.customer_booking);
router.post('/assign-driver' ,bookingController.assign_driver);
router.post('/assign-folder' ,bookingController.assign_folder);
router.post('/delete-booking-date',CheckAuth ,bookingController.delete_booking_date);
router.get('/user-subscription-dates',CheckAuth ,bookingController.subscription_dates);
router.get('/booking-tracking-status',CheckAuth ,bookingController.booking_tracking_status);
router.get('/get-load-price',CheckAuth ,loadController.get_load_price);
router.post('/customer-login',userController.customer_login);
router.post('/forgot-password',userController.forgot_password);
router.post('/verify-otp',userController.verify_otp);
router.post('/change-password',userController.change_password);
router.post("/ss", qr_slip);
//********************************Driver Module**************************************//
router.get('/get-orders',CheckAuth,driverController.get_orders);
router.post("/get-order-detail",CheckAuth,driverController.get_order_detail);
router.post("/print-All-QrCode",CheckAuth,driverController.print_All_QrCode)
router.get("/get-dry-clean-orders",CheckAuth,driverController.get_dry_clean_orders)
router.get("/get-dry-clean-drop-orders",CheckAuth,driverController.get_dry_clean_drop_orders)
router.post("/print-All-Drop-QrCode",CheckAuth,driverController.print_All_Drop_QrCode)
router.post("/pickup-loads",CheckAuth,driverController.pickup_loads)
router.post("/pickup-loads-detail",CheckAuth,driverController.pickup_loads_detail);
router.post("/submit_pickup_details",CheckAuth,upload.array("images", 5),driverController.submit_pickup_details);
router.post("/laundry-NotFound",CheckAuth,upload.array("images", 5),driverController.laundry_NotFound);
router.get("/order-histroy",CheckAuth,driverController.order_histroy);
router.post("/order-histroy-byOrderId",CheckAuth,driverController.order_histroy_byOrderId);
router.get("/profile",CheckAuth,driverController.profile)
router.get("/get-drop-orders",CheckAuth,driverController.get_drop_orders);
router.post("/get-drop-order-detail",CheckAuth,driverController.get_drop_order_detail);
router.post("/drop-loads",CheckAuth,driverController.drop_loads);
router.post("/drop-loads-detail",CheckAuth,driverController.drop_loads_detail);
router.post("/submit_drop_details",CheckAuth,upload.array("images", 5),driverController.submit_drop_details);
//********************************Folder Module**************************************//
router.post("/Scan-received-loads",CheckAuth,FolderController.Scan_received_loads)
router.get("/customer-list-wash",CheckAuth,FolderController.customer_list_wash)
router.post("/wash-detail-ByCustomer-id",CheckAuth,FolderController.wash_detail_ByCustomer_id)
router.post("/submit-wash-detail",CheckAuth,upload.array("images", 5),FolderController.submit_wash_detail)
router.post("/Scan-loads-For-Dry",CheckAuth,FolderController.Scan_loads_For_Dry)
//router.post("/submit-dry-detail",CheckAuth,upload.array("images", 5),FolderController.submit_dry_detail)
router.post("/booking-pickup-instruction",CheckAuth,bookingController.booking_pickup_instruction)
router.post("/booking-delievery-instruction",CheckAuth,bookingController.booking_delievery_instruction)
router.post("/Scan-loads-For-Fold",CheckAuth,FolderController.Scan_loads_For_Fold)
//router.post("/submit-fold-detail",CheckAuth,upload.array("images", 5),FolderController.submit_fold_detail)
router.post("/Scan-loads-For-Pack",CheckAuth,FolderController.Scan_loads_For_Pack)
router.get("/folder-order-histroy",CheckAuth,FolderController.order_histroy);
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
//**********************************************************************************//
router.get("/get-dry-clean-services",CheckAuth,DrycleanController.get_category)
router.get("/get-cart-item",CheckAuth,DrycleanController.get_cart_items)
router.post("/add-to-cart",CheckAuth,DrycleanController.Add_To_Cart)
router.post("/delete-cart-item",CheckAuth,DrycleanController.delete_cart_item)
router.post("/dry-clean-booking",CheckAuth,DrycleanController.dry_clean_booking)

/***********Admin panel***************/

router.get("/get_content",AdminController.get_page_content)
router.get("/get_faq",AdminController.get_faq_content)
router.post("/update_page_content",CheckAuth,AdminController.update_page_content)
router.post("/create_faq",CheckAuth,AdminController.create_faq)
router.post("/update_faq",CheckAuth,AdminController.update_faq)
router.post("/delete_faq",CheckAuth,AdminController.delete_faq)
router.get("/get_dashboard_content",CheckAuth,AdminController.get_dashboard_content)
router.get("/get_packagesList",CheckAuth,AdminController.get_packagesList)
router.post("/update_packages",CheckAuth,AdminController.update_packages)
router.post("/create_packages",CheckAuth,AdminController.create_packages)
router.post("/delete_packages",CheckAuth,AdminController.delete_packages)
router.get("/get_package_details/:id?",CheckAuth,AdminController.get_package_details)
router.get("/get_userList/:category_id?",CheckAuth,AdminController.get_userList)
router.post("/update_package_status",CheckAuth,AdminController.update_package_status)
router.post("/update_faq_index",CheckAuth,AdminController.update_faq_index)
router.get("/get_all_order/:type?/:searchStr?/:start?/:limit?",AdminController.get_all_order)



/*dry cleaning*/
router.post("/update_drycleaning_service",upload.single('service_pic'),AdminController.update_drycleaning_service)
router.post("/add_drycleaning_service",upload.single('service_pic'),AdminController.add_drycleaning_service)
router.post("/update_service_status",CheckAuth,AdminController.update_service_status)
router.post("/delete_service",CheckAuth,AdminController.delete_service)
router.get("/get_drycleaning_itemlist",CheckAuth,AdminController.get_drycleaning_itemlist)



/**********************/
export default router;