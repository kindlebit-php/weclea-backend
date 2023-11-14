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
import emailController from "../controllers/Admin/EmailController.js";
import groupController from "../controllers/Admin/GroupController.js";
import permissionController from "../controllers/Admin/PermissionController.js";


import multer from 'multer';
import { upload } from "../utils/multer.js";
import { uploadS3 } from "../utils/multerS3.js";

import DrycleanController from "../controllers/DrycleanController.js";
import FolderController from "../controllers/Folder/FolderController.js";
import { qr_slip } from "../helpers/qr_slip.js";


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
router.get("/customer-list",userController.customer_list)
router.get("/folder-list",userController.folder_list)
router.get("/order-list",userController.order_list)

router.post('/get-loads' ,CheckAuth, loadController.get_loads);
router.get('/get-user-profile' ,CheckAuth,userController.get_user_profile);
router.get('/get-delivery-instruction' ,CheckAuth,userController.get_deleivery_instruction);
router.post('/get-user-loads',CheckAuth ,loadController.get_user_loads);
router.post('/get-user-home-data',CheckAuth ,loadController.get_user_home_data);
router.get('/get-user-subscription',CheckAuth ,loadController.get_user_subscription);
router.post('/customer-loads-subscription',CheckAuth ,loadController.customer_loads_subscription);
router.post('/customer-booking',CheckAuth ,bookingController.customer_booking);
router.post('/booking-rating',CheckAuth ,uploadS3.array("images", 5),bookingController.booking_rating);
router.post('/assign-driver' ,bookingController.assign_driver);
router.post('/assign-folder' ,bookingController.assign_folder);
router.post('/delete-booking-date',CheckAuth ,bookingController.delete_booking_date);
router.get('/user-subscription-dates',CheckAuth ,bookingController.subscription_dates);
router.get('/subscription-dates-fre',CheckAuth ,bookingController.subscription_dates_fre);
router.get('/subscription-dates-custom',CheckAuth ,bookingController.subscription_dates_custom);
router.get('/booking-history',CheckAuth ,bookingController.booking_history);
router.get('/booking-tracking-status',CheckAuth ,bookingController.booking_tracking_status);
router.post('/booking-tracking-details',CheckAuth ,bookingController.booking_tracking_details);
router.get('/get-load-price',CheckAuth ,loadController.get_load_price);
router.post('/customer-login',userController.customer_login);
router.post('/forgot-password',userController.forgot_password);
router.post('/verify-otp',userController.verify_otp);
router.post('/change-password',userController.change_password);
router.get("/customer-order-histroy",CheckAuth,userController.customer_order_histroy)
router.post("/ss", qr_slip);
//********************************Driver Module**************************************//
router.post('/get-orders',CheckAuth,driverController.get_orders);
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
router.post("/get-drop-orders",CheckAuth,driverController.get_drop_orders);
router.post("/get-drop-order-detail",CheckAuth,driverController.get_drop_order_detail);
router.post("/drop-loads",CheckAuth,driverController.drop_loads);
router.post("/drop-loads-detail",CheckAuth,driverController.drop_loads_detail);
router.post("/submit_drop_details",CheckAuth,uploadS3.array("images", 5),driverController.submit_drop_details);
//********************************Folder Module**************************************//
router.post("/Scan-received-loads",CheckAuth,FolderController.Scan_received_loads)
router.post("/customer-list-wash",CheckAuth,FolderController.customer_list_wash)
router.post("/wash-detail-ByCustomer-id",CheckAuth,FolderController.wash_detail_ByCustomer_id)
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
router.post("/customer-list-dryClean",CheckAuth,DrycleanController.customer_list_dryClean)
router.post("/submit-dryClean-process-detail",CheckAuth,uploadS3.fields([{ name: "images", maxCount: 5 },{ name: "extra_loads_images", maxCount: 5 },]),DrycleanController.submit_dryClean_process_detail)
router.post("/print-DryClean-extra-loads-QrCode",CheckAuth,DrycleanController.print_DryClean_extra_loads_QrCode)
router.post("/scanning-extra-loads-dryClean",CheckAuth,DrycleanController.scanning_extra_loads_dryClean)
router.post("/order-history-dryClean",CheckAuth,DrycleanController.order_histroy_dryClean);
router.post("/order-histroy-dryClean-detail",CheckAuth,DrycleanController.order_histroy_dryClean_detail)

/*********** ------------ Admin panel ---------------***************/

router.post("/admin_login",AdminController.admin_login)
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
router.get("/get_user_history/:user_id?",CheckAuth,AdminController.get_user_history)
router.get("/get_all_userList/",CheckAuth,AdminController.get_all_userList)
router.post("/update_extra_chagres_status",CheckAuth,AdminController.update_extra_chagres_status)

router.get("/get_countries",AdminController.get_countries)
router.get("/get_states/:country_id?",AdminController.get_states)
router.get("/get_cities/:state_id?",AdminController.get_cities)



router.post("/update_package_status",CheckAuth,AdminController.update_package_status)
router.post("/update_faq_index",CheckAuth,AdminController.update_faq_index)
router.get("/get_all_order/:type?/:searchStr?/:start?/:limit?",CheckAuth,AdminController.get_all_order)
router.get("/get_order_detail/:booking_id?/:user_id?",CheckAuth,AdminController.get_order_detail)
router.get("/get_all_driver/:searchStr?/:start?/:limit?",AdminController.get_all_driver)
router.get("/get_driver_detail/:user_id?/:searchStr?/:start?/:limit?",AdminController.get_driver_detail)
router.get("/get_ratingList",CheckAuth,AdminController.get_ratingList)
router.get("/get_feedbackQesList",CheckAuth,AdminController.get_feedbackQesList)
router.post("/update_feedbackQes",CheckAuth,AdminController.update_feedbackQes)
router.post("/create_feedbackQes",CheckAuth,AdminController.create_feedbackQes)
router.post("/delete_feedbackQes",CheckAuth,AdminController.delete_feedbackQes)
router.post("/update_feedbackQes_status",CheckAuth,AdminController.update_feedbackQes_status)

/**** Email template****/

router.get("/get_emailTemplate",CheckAuth,emailController.get_emailTemplate)
router.get("/get_emailTemplate_detail",CheckAuth,emailController.get_emailTemplate_detail)
router.post("/update_emailTemplate",CheckAuth,emailController.update_emailTemplate)
router.post("/create_emailTemplate",CheckAuth,emailController.create_emailTemplate)
router.post("/delete_emailTemplate",CheckAuth,emailController.delete_emailTemplate)
router.post("/update_emailTemplate_status",CheckAuth,emailController.update_emailTemplate_status)

/****** Admin group ***********/
router.get("/get_group_list",CheckAuth,groupController.get_group_list)
router.post("/create_group",uploadS3.array('profile_pic',25),groupController.create_group);
router.post("/update_group",uploadS3.array('profile_pic',25),groupController.update_group);
router.post("/delete_group",CheckAuth,groupController.delete_group)
router.post("/get_grouped_emp_list",CheckAuth,groupController.get_grouped_emp_list)

/****** Admin Role & Permission ***********/
router.get("/getRole",CheckAuth,permissionController.getRole)
router.get("/getRoleDetail/:role_id/",CheckAuth,permissionController.getRoleDetail)
router.get("/delRole/:role_id/",CheckAuth,permissionController.delRole)
router.get("/getPermissionsDetail/:permission_id/",CheckAuth,permissionController.getPermissionsDetail)
router.get("/delPermission/:permission_id/",CheckAuth,permissionController.delPermissions)
router.get("/getPermissions",CheckAuth,permissionController.getPermissions)
router.get("/getRoleAndPermissionById/:role_id/",CheckAuth,permissionController.getRoleAndPermissionById)
router.get("/getRoleAndPermission",CheckAuth,permissionController.getRoleAndPermission)
     
//router.post("/updateLoginAccess",CheckAuth,permissionController.updateLoginAccess)
router.post("/updateAssignRole",CheckAuth,permissionController.updateAssignRole)
router.post("/assignRole",CheckAuth,permissionController.assignRole)
router.post("/addRoleAndPermission",CheckAuth,permissionController.addRoleAndPermission)
router.post("/addPermission",CheckAuth,permissionController.addPermission)
router.post("/addRole",CheckAuth,permissionController.addRole)
router.post("/updateLoginAccess",CheckAuth,permissionController.updateLoginAccess)
    
	
/*****  ---------- Admin API End ---------- *****/
/*dry cleaning*/
router.post("/update_drycleaning_service",uploadS3.single('service_pic'),AdminController.update_drycleaning_service)
router.post("/add_drycleaning_service",uploadS3.single('service_pic'),AdminController.add_drycleaning_service)
router.post("/update_service_status",CheckAuth,AdminController.update_service_status)
router.post("/delete_service",CheckAuth,AdminController.delete_service)
router.get("/get_drycleaning_itemlist",CheckAuth,AdminController.get_drycleaning_itemlist)



/**********************/
export default router;