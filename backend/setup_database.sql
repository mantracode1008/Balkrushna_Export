-- MySQL dump
--
-- Host: localhost    Database: diamond_inventory
-- ------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `diamond_inventory`;
USE `diamond_inventory`;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'dd19b994-efdd-11f0-b0cf-87a39c24dff1:1-121661';

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `role` enum('admin','staff') DEFAULT 'admin',
  `password` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `pin` varchar(255) DEFAULT NULL,
  `otp` varchar(255) DEFAULT NULL,
  `otp_expires` datetime DEFAULT NULL,
  `admin_password` varchar(255) DEFAULT NULL,
  `failed_attempts` int DEFAULT '0',
  `lock_until` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `staff_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `mobile` (`mobile`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `staff_id` (`staff_id`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `mobile_2` (`mobile`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `staff_id_2` (`staff_id`),
  UNIQUE KEY `username_3` (`username`),
  UNIQUE KEY `mobile_3` (`mobile`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `staff_id_3` (`staff_id`),
  UNIQUE KEY `username_4` (`username`),
  UNIQUE KEY `mobile_4` (`mobile`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `staff_id_4` (`staff_id`),
  UNIQUE KEY `username_5` (`username`),
  UNIQUE KEY `mobile_5` (`mobile`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `staff_id_5` (`staff_id`),
  UNIQUE KEY `username_6` (`username`),
  UNIQUE KEY `mobile_6` (`mobile`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `staff_id_6` (`staff_id`),
  UNIQUE KEY `username_7` (`username`),
  UNIQUE KEY `mobile_7` (`mobile`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `staff_id_7` (`staff_id`),
  UNIQUE KEY `username_8` (`username`),
  UNIQUE KEY `mobile_8` (`mobile`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `staff_id_8` (`staff_id`),
  UNIQUE KEY `username_9` (`username`),
  UNIQUE KEY `mobile_9` (`mobile`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `staff_id_9` (`staff_id`),
  UNIQUE KEY `username_10` (`username`),
  UNIQUE KEY `mobile_10` (`mobile`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `staff_id_10` (`staff_id`),
  UNIQUE KEY `username_11` (`username`),
  UNIQUE KEY `mobile_11` (`mobile`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `staff_id_11` (`staff_id`),
  UNIQUE KEY `username_12` (`username`),
  UNIQUE KEY `mobile_12` (`mobile`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `staff_id_12` (`staff_id`),
  UNIQUE KEY `username_13` (`username`),
  UNIQUE KEY `mobile_13` (`mobile`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `staff_id_13` (`staff_id`),
  UNIQUE KEY `username_14` (`username`),
  UNIQUE KEY `mobile_14` (`mobile`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `staff_id_14` (`staff_id`),
  UNIQUE KEY `username_15` (`username`),
  UNIQUE KEY `mobile_15` (`mobile`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `staff_id_15` (`staff_id`),
  UNIQUE KEY `username_16` (`username`),
  UNIQUE KEY `mobile_16` (`mobile`),
  UNIQUE KEY `email_16` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `country` varchar(255) NOT NULL,
  `address` text,
  `city` varchar(255) DEFAULT NULL,
  `contact_number` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT 'USD',
  `remarks` text,
  `created_by` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `gst_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_by` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `name_11` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diamonds`
--

DROP TABLE IF EXISTS `diamonds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diamonds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `certificate` varchar(255) NOT NULL,
  `certificate_date` varchar(255) DEFAULT NULL,
  `description` text,
  `shape` varchar(255) DEFAULT NULL,
  `S_code` varchar(255) DEFAULT NULL,
  `measurements` varchar(255) DEFAULT NULL,
  `carat` decimal(10,2) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `color_code` int DEFAULT NULL,
  `clarity` varchar(255) DEFAULT NULL,
  `clarity_code` varchar(255) DEFAULT NULL,
  `cut` varchar(255) DEFAULT NULL,
  `lab` varchar(255) DEFAULT NULL,
  `polish` varchar(255) DEFAULT NULL,
  `symmetry` varchar(255) DEFAULT NULL,
  `fluorescence` varchar(255) DEFAULT NULL,
  `crown_height` varchar(255) DEFAULT NULL,
  `pavilion_depth` varchar(255) DEFAULT NULL,
  `girdle_thickness` varchar(255) DEFAULT NULL,
  `culet` varchar(255) DEFAULT NULL,
  `total_depth_percent` varchar(255) DEFAULT NULL,
  `table_percent` varchar(255) DEFAULT NULL,
  `comments` text,
  `inscription` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int DEFAULT '1',
  `status` enum('in_stock','sold','in_cart') DEFAULT 'in_stock',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `growth_process` varchar(255) DEFAULT NULL,
  `report_url` text,
  `diamond_type` varchar(255) DEFAULT NULL,
  `buyer_name` varchar(255) DEFAULT NULL,
  `buyer_country` varchar(255) DEFAULT NULL,
  `buyer_mobile` varchar(255) DEFAULT NULL,
  `sale_price` decimal(10,2) DEFAULT NULL,
  `seller_country` varchar(255) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `ratio` varchar(255) DEFAULT NULL,
  `shade` varchar(255) DEFAULT NULL,
  `inclusion` varchar(255) DEFAULT NULL,
  `key_to_symbols` text,
  `lab_comment` text,
  `member_comment` text,
  `vendor_stock_no` varchar(255) DEFAULT NULL,
  `item_url` text,
  `price_per_carat` decimal(10,2) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `rap_discount` decimal(10,2) DEFAULT NULL,
  `seller_name` varchar(255) DEFAULT NULL,
  `sale_type` enum('STOCK','ORDER') DEFAULT 'STOCK',
  `client_id` int DEFAULT NULL,
  `currency` varchar(255) DEFAULT 'USD',
  `exchange_rate` decimal(10,2) DEFAULT '1.00',
  `commission_usd` decimal(10,2) DEFAULT '0.00',
  `commission_inr` decimal(10,2) DEFAULT '0.00',
  `final_price_usd` decimal(10,2) DEFAULT NULL,
  `final_price_inr` decimal(10,2) DEFAULT NULL,
  `sale_date` datetime DEFAULT NULL,
  `sold_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate` (`certificate`),
  UNIQUE KEY `certificate_2` (`certificate`),
  UNIQUE KEY `certificate_3` (`certificate`),
  UNIQUE KEY `certificate_4` (`certificate`),
  UNIQUE KEY `certificate_5` (`certificate`),
  UNIQUE KEY `certificate_6` (`certificate`),
  UNIQUE KEY `certificate_7` (`certificate`),
  UNIQUE KEY `certificate_8` (`certificate`),
  UNIQUE KEY `certificate_9` (`certificate`),
  UNIQUE KEY `certificate_10` (`certificate`),
  UNIQUE KEY `certificate_11` (`certificate`),
  UNIQUE KEY `certificate_12` (`certificate`),
  UNIQUE KEY `certificate_13` (`certificate`),
  KEY `created_by` (`created_by`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `diamonds_ibfk_15` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `diamonds_ibfk_16` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=234 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quantity` int DEFAULT '1',
  `sale_price` decimal(10,2) DEFAULT NULL,
  `commission` decimal(10,2) DEFAULT '0.00',
  `profit` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `invoiceId` int DEFAULT NULL,
  `diamondId` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `rate_per_carat` decimal(10,2) DEFAULT NULL,
  `carat_weight` decimal(8,2) DEFAULT NULL,
  `billed_amount` decimal(10,2) DEFAULT '0.00',
  `billed_rate` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `diamondId` (`diamondId`),
  KEY `invoiceId` (`invoiceId`),
  CONSTRAINT `invoice_items_ibfk_225` FOREIGN KEY (`diamondId`) REFERENCES `diamonds` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoice_items_ibfk_226` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_date` datetime DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `total_profit` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `exchange_rate` decimal(10,2) DEFAULT NULL,
  `commission_total_usd` decimal(10,2) DEFAULT NULL,
  `commission_total_inr` decimal(10,2) DEFAULT NULL,
  `final_amount_usd` decimal(10,2) DEFAULT NULL,
  `final_amount_inr` decimal(10,2) DEFAULT NULL,
  `payment_status` enum('Pending','Paid','Partial','Overdue','Cancelled') DEFAULT 'Pending',
  `remarks` text,
  `payment_terms` varchar(255) DEFAULT NULL,
  `due_days` int DEFAULT '0',
  `due_date` datetime DEFAULT NULL,
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `balance_due` decimal(10,2) DEFAULT NULL,
  `payment_history` json DEFAULT NULL,
  `subtotal_amount` decimal(10,2) DEFAULT NULL,
  `cgst_rate` decimal(5,2) DEFAULT '0.75',
  `sgst_rate` decimal(5,2) DEFAULT '0.75',
  `cgst_amount` decimal(10,2) DEFAULT '0.00',
  `sgst_amount` decimal(10,2) DEFAULT '0.00',
  `total_gst` decimal(10,2) DEFAULT '0.00',
  `grand_total` decimal(10,2) DEFAULT NULL,
  `gst_number` varchar(255) DEFAULT NULL,
  `billing_country` varchar(255) DEFAULT NULL,
  `subtotal_usd` decimal(10,2) DEFAULT '0.00',
  `grand_total_usd` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `invoices_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_5` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `OrigionalRapRate_Live_Tbl`
--

DROP TABLE IF EXISTS `OrigionalRapRate_Live_Tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `OrigionalRapRate_Live_Tbl` (
  `F_Carat` decimal(10,3) NOT NULL,
  `T_Carat` decimal(10,3) NOT NULL,
  `S_Code` varchar(5) NOT NULL,
  `C_Code` smallint NOT NULL,
  `RapDate` date NOT NULL,
  `Parameter_Value` varchar(15) NOT NULL,
  `Q1` decimal(10,2) DEFAULT '0.00',
  `Q2` decimal(10,2) DEFAULT '0.00',
  `Q3` decimal(10,2) DEFAULT '0.00',
  `Q4` decimal(10,2) DEFAULT '0.00',
  `Q5` decimal(10,2) DEFAULT '0.00',
  `Q6` decimal(10,2) DEFAULT '0.00',
  `Q7` decimal(10,2) DEFAULT '0.00',
  `Q8` decimal(10,2) DEFAULT '0.00',
  `Q9` decimal(10,2) DEFAULT '0.00',
  `Q10` decimal(10,2) DEFAULT '0.00',
  `Q11` decimal(10,2) DEFAULT '0.00',
  `Q12` decimal(10,2) DEFAULT '0.00',
  `Q13` decimal(10,2) DEFAULT '0.00',
  `Q14` decimal(10,2) DEFAULT '0.00',
  `Q15` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`F_Carat`,`T_Carat`,`S_Code`,`C_Code`,`RapDate`,`Parameter_Value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ParameterDateMaster_Tbl`
--

DROP TABLE IF EXISTS `ParameterDateMaster_Tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ParameterDateMaster_Tbl` (
  `RapDate` date NOT NULL,
  `Parameter_Id` varchar(50) NOT NULL DEFAULT '',
  `Parameter_Number` int DEFAULT '0',
  `Remark` varchar(1000) DEFAULT '',
  PRIMARY KEY (`RapDate`,`Parameter_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ParameterDiscount_Tbl`
--

DROP TABLE IF EXISTS `ParameterDiscount_Tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ParameterDiscount_Tbl` (
  `F_Carat` decimal(10,3) NOT NULL,
  `T_Carat` decimal(10,3) NOT NULL,
  `S_Code` varchar(5) NOT NULL,
  `C_Code` smallint NOT NULL,
  `RapDate` date NOT NULL,
  `Parameter_Id` varchar(50) NOT NULL,
  `Parameter_Number` int DEFAULT '0',
  `Parameter_Value` varchar(15) NOT NULL,
  `Q1` decimal(10,4) DEFAULT '0.0000',
  `Q2` decimal(10,4) DEFAULT '0.0000',
  `Q3` decimal(10,4) DEFAULT '0.0000',
  `Q4` decimal(10,4) DEFAULT '0.0000',
  `Q5` decimal(10,4) DEFAULT '0.0000',
  `Q6` decimal(10,4) DEFAULT '0.0000',
  `Q7` decimal(10,4) DEFAULT '0.0000',
  `Q8` decimal(10,4) DEFAULT '0.0000',
  `Q9` decimal(10,4) DEFAULT '0.0000',
  `Q10` decimal(10,4) DEFAULT '0.0000',
  `Q11` decimal(10,4) DEFAULT '0.0000',
  `Q12` decimal(10,4) DEFAULT '0.0000',
  `Q13` decimal(10,4) DEFAULT '0.0000',
  `Q14` decimal(10,4) DEFAULT '0.0000',
  `Q15` decimal(10,4) DEFAULT '0.0000',
  PRIMARY KEY (`F_Carat`,`T_Carat`,`S_Code`,`C_Code`,`RapDate`,`Parameter_Id`,`Parameter_Value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-27 18:21:57
