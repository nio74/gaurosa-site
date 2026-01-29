-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: gaurosasite
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mazgest_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_slug_key` (`slug`),
  UNIQUE KEY `brands_mazgest_id_key` (`mazgest_id`),
  KEY `brands_is_active_idx` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,6,'MORELLATO CINTURINI','morellato-cinturini',NULL,1,0),(2,1,'Gaurosa','gaurosa',NULL,1,0);
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cart_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cart_items_cart_id_product_id_variant_id_key` (`cart_id`,`product_id`,`variant_id`),
  CONSTRAINT `cart_items_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `carts_session_id_key` (`session_id`),
  KEY `carts_session_id_idx` (`session_id`),
  KEY `carts_expires_at_idx` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `image_url` varchar(500) DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `product_count` int(11) NOT NULL DEFAULT 0,
  `show_in_menu` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_key` (`slug`),
  KEY `categories_parent_id_idx` (`parent_id`),
  KEY `categories_is_active_idx` (`is_active`),
  KEY `categories_show_in_menu_idx` (`show_in_menu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mazgest_id` int(11) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `billing_address` varchar(255) DEFAULT NULL,
  `billing_city` varchar(100) DEFAULT NULL,
  `billing_province` varchar(10) DEFAULT NULL,
  `billing_postcode` varchar(20) DEFAULT NULL,
  `billing_country` varchar(2) DEFAULT 'IT',
  `shipping_address` varchar(255) DEFAULT NULL,
  `shipping_city` varchar(100) DEFAULT NULL,
  `shipping_province` varchar(10) DEFAULT NULL,
  `shipping_postcode` varchar(20) DEFAULT NULL,
  `shipping_country` varchar(2) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `codice_fiscale` varchar(16) DEFAULT NULL,
  `codice_sdi` varchar(7) DEFAULT NULL,
  `consented_at` datetime(3) DEFAULT NULL,
  `customer_type` varchar(20) DEFAULT 'privato',
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `email_verified_at` datetime(3) DEFAULT NULL,
  `from_website` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime(3) DEFAULT NULL,
  `last_sync_error` text DEFAULT NULL,
  `marketing_consent` tinyint(1) NOT NULL DEFAULT 0,
  `partita_iva` varchar(11) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `pec` varchar(255) DEFAULT NULL,
  `ragione_sociale` varchar(255) DEFAULT NULL,
  `sync_status` varchar(20) NOT NULL DEFAULT 'pending',
  `synced_at` datetime(3) DEFAULT NULL,
  `token_expires_at` datetime(3) DEFAULT NULL,
  `verification_token` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_email_key` (`email`),
  UNIQUE KEY `customers_mazgest_id_key` (`mazgest_id`),
  UNIQUE KEY `customers_verification_token_key` (`verification_token`),
  KEY `customers_email_verified_idx` (`email_verified`),
  KEY `customers_sync_status_idx` (`sync_status`),
  KEY `customers_from_website_idx` (`from_website`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,1,'mpaolo74@gmail.com','Paolo','Mazzon','+393473674959',NULL,NULL,NULL,NULL,'IT',NULL,NULL,NULL,NULL,NULL,'2026-01-29 11:21:11.816','2026-01-29 13:51:57.562',NULL,NULL,NULL,'privato',1,'2026-01-29 14:46:27.000',1,'2026-01-29 13:51:57.559',NULL,0,NULL,'$2b$12$a/qBYikq4WdPTHBXhyDIiuz2DKmc9yFRszgZnoeUmida5yaNEqD7O',NULL,NULL,'synced','2026-01-29 14:50:58.000',NULL,NULL);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `filter_values`
--

DROP TABLE IF EXISTS `filter_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `filter_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `attribute_type` varchar(50) NOT NULL,
  `value` varchar(100) NOT NULL,
  `label` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `product_count` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `filter_values_attribute_type_value_key` (`attribute_type`,`value`),
  KEY `filter_values_attribute_type_idx` (`attribute_type`),
  KEY `filter_values_is_active_idx` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `filter_values`
--

LOCK TABLES `filter_values` WRITE;
/*!40000 ALTER TABLE `filter_values` DISABLE KEYS */;
INSERT INTO `filter_values` VALUES (3,'item_condition','nuovo','nuovo','nuovo',0,1,1),(4,'main_category','gioielli','gioielli','gioielli',0,1,1),(5,'subcategory','anello','anello','anello',0,1,1);
/*!40000 ALTER TABLE `filter_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_code` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `variant_sku` varchar(100) DEFAULT NULL,
  `variant_name` varchar(100) DEFAULT NULL,
  `is_virtual_variant` tinyint(1) NOT NULL DEFAULT 0,
  `ordered_size` varchar(20) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_idx` (`order_id`),
  KEY `order_items_product_id_idx` (`product_id`),
  CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `mazgest_order_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_name` varchar(200) NOT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `payment_status` varchar(30) NOT NULL DEFAULT 'pending',
  `billing_address` text DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `shipping_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `shipping_method` varchar(100) DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `tracking_url` varchar(500) DEFAULT NULL,
  `customer_notes` text DEFAULT NULL,
  `internal_notes` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `paid_at` datetime(3) DEFAULT NULL,
  `shipped_at` datetime(3) DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `sent_to_mazgest` tinyint(1) NOT NULL DEFAULT 0,
  `sent_at` datetime(3) DEFAULT NULL,
  `invoice_codice_fiscale` varchar(16) DEFAULT NULL,
  `invoice_codice_sdi` varchar(7) DEFAULT NULL,
  `invoice_generated` tinyint(1) NOT NULL DEFAULT 0,
  `invoice_generated_at` datetime(3) DEFAULT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `invoice_partita_iva` varchar(11) DEFAULT NULL,
  `invoice_pec` varchar(255) DEFAULT NULL,
  `invoice_ragione_sociale` varchar(255) DEFAULT NULL,
  `invoice_type` varchar(20) DEFAULT NULL,
  `is_guest` tinyint(1) NOT NULL DEFAULT 0,
  `payment_reference` varchar(100) DEFAULT NULL,
  `requires_invoice` tinyint(1) NOT NULL DEFAULT 0,
  `sync_error` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number_key` (`order_number`),
  KEY `orders_status_idx` (`status`),
  KEY `orders_payment_status_idx` (`payment_status`),
  KEY `orders_customer_id_idx` (`customer_id`),
  KEY `orders_created_at_idx` (`created_at`),
  KEY `orders_requires_invoice_idx` (`requires_invoice`),
  KEY `orders_is_guest_idx` (`is_guest`),
  CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `token` varchar(100) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_resets_token_key` (`token`),
  KEY `password_resets_customer_id_idx` (`customer_id`),
  KEY `password_resets_token_idx` (`token`),
  CONSTRAINT `password_resets_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `url` varchar(500) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `product_images_product_id_idx` (`product_id`),
  CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (19,19,'https://api.mazgest.org/uploads/jewelry-products/919/img-1769280709892-693382004.png',1,0),(20,20,'https://api.mazgest.org/uploads/jewelry-products/918/img-1769280463395-485958319.jpg',1,0),(21,21,'https://api.mazgest.org/uploads/jewelry-products/917/img-1769280194537-464344961.jpg',1,0);
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_variants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `mazgest_variant_id` int(11) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `attribute_name` varchar(50) DEFAULT NULL,
  `attribute_value` varchar(50) DEFAULT NULL,
  `is_virtual` tinyint(1) NOT NULL DEFAULT 0,
  `parent_variant_id` int(11) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `product_variants_product_id_idx` (`product_id`),
  KEY `product_variants_sku_idx` (`sku`),
  CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mazgest_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `ean` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `load_type` varchar(50) DEFAULT NULL,
  `main_category` varchar(50) DEFAULT NULL,
  `subcategory` varchar(100) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `compare_at_price` decimal(10,2) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `stock_status` varchar(20) NOT NULL DEFAULT 'in_stock',
  `material_primary` varchar(50) DEFAULT NULL,
  `material_color` varchar(30) DEFAULT NULL,
  `material_weight_grams` decimal(8,3) DEFAULT NULL,
  `stone_main_type` varchar(50) DEFAULT NULL,
  `stone_main_carats` decimal(6,3) DEFAULT NULL,
  `stone_main_color` varchar(30) DEFAULT NULL,
  `stone_main_clarity` varchar(10) DEFAULT NULL,
  `stone_main_cut` varchar(30) DEFAULT NULL,
  `stone_main_certificate` varchar(100) DEFAULT NULL,
  `stones_secondary_type` varchar(50) DEFAULT NULL,
  `stones_secondary_count` int(11) DEFAULT NULL,
  `pearl_type` varchar(50) DEFAULT NULL,
  `pearl_size_mm` decimal(4,1) DEFAULT NULL,
  `pearl_color` varchar(30) DEFAULT NULL,
  `size_ring_it` int(11) DEFAULT NULL,
  `size_bracelet_cm` decimal(4,1) DEFAULT NULL,
  `size_necklace_cm` int(11) DEFAULT NULL,
  `size_earring_mm` decimal(5,1) DEFAULT NULL,
  `ring_type` varchar(50) DEFAULT NULL,
  `ring_style` varchar(50) DEFAULT NULL,
  `earring_type` varchar(50) DEFAULT NULL,
  `bracelet_type` varchar(50) DEFAULT NULL,
  `necklace_type` varchar(50) DEFAULT NULL,
  `pendant_type` varchar(50) DEFAULT NULL,
  `watch_gender` varchar(20) DEFAULT NULL,
  `watch_type` varchar(50) DEFAULT NULL,
  `watch_movement` varchar(50) DEFAULT NULL,
  `item_condition` varchar(20) DEFAULT 'nuovo',
  `seo_title` varchar(255) DEFAULT NULL,
  `seo_description` text DEFAULT NULL,
  `description_it` text DEFAULT NULL,
  `description_en` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `synced_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_mazgest_id_key` (`mazgest_id`),
  UNIQUE KEY `products_code_key` (`code`),
  UNIQUE KEY `products_slug_key` (`slug`),
  KEY `products_main_category_idx` (`main_category`),
  KEY `products_subcategory_idx` (`subcategory`),
  KEY `products_brand_id_idx` (`brand_id`),
  KEY `products_supplier_id_idx` (`supplier_id`),
  KEY `products_material_primary_idx` (`material_primary`),
  KEY `products_stone_main_type_idx` (`stone_main_type`),
  KEY `products_stock_status_idx` (`stock_status`),
  KEY `products_is_active_idx` (`is_active`),
  KEY `products_slug_idx` (`slug`),
  KEY `products_price_idx` (`price`),
  CONSTRAINT `products_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (19,919,'M01026',NULL,'10461808','10461808-m01026',NULL,'produzione_propria','gioielli','anello',NULL,NULL,1070.50,NULL,1,'in_stock',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'nuovo',NULL,NULL,NULL,NULL,1,0,'2026-01-29 10:55:18.825','2026-01-29 10:55:18.825','2026-01-29 10:55:18.819'),(20,918,'M01024',NULL,'GAAN23','gaan23-m01024',NULL,'produzione_propria','gioielli','anello',NULL,NULL,947.00,NULL,1,'in_stock',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'nuovo',NULL,NULL,NULL,NULL,1,0,'2026-01-29 10:55:18.940','2026-01-29 10:55:18.940','2026-01-29 10:55:18.937'),(21,917,'M01022',NULL,'10469156','10469156-m01022',NULL,'produzione_propria','gioielli','anello',NULL,NULL,1521.50,NULL,1,'in_stock',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'nuovo',NULL,NULL,NULL,NULL,1,0,'2026-01-29 10:55:19.006','2026-01-29 10:55:19.006','2026-01-29 10:55:19.003');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `revoked_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_token_key` (`token`),
  KEY `refresh_tokens_customer_id_idx` (`customer_id`),
  KEY `refresh_tokens_expires_at_idx` (`expires_at`),
  CONSTRAINT `refresh_tokens_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (1,1,'a309d65a33564e520f57d043bfe90b98e82182db2ec42903739a40e8e46fe416','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','169.254.123.189','2026-02-05 13:51:57.542','2026-01-29 13:51:57.544',NULL);
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mazgest_id` int(11) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `suppliers_slug_key` (`slug`),
  UNIQUE KEY `suppliers_mazgest_id_key` (`mazgest_id`),
  KEY `suppliers_is_active_idx` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,9,'MORELLATO Cinturini','morellato-cinturini',1),(2,6,'Mazzon Gioielli Snc','mazzon-gioielli-snc',1);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sync_logs`
--

DROP TABLE IF EXISTS `sync_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sync_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `direction` varchar(10) NOT NULL,
  `status` varchar(20) NOT NULL,
  `items_total` int(11) NOT NULL DEFAULT 0,
  `items_processed` int(11) NOT NULL DEFAULT 0,
  `items_failed` int(11) NOT NULL DEFAULT 0,
  `error_message` text DEFAULT NULL,
  `details` text DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `completed_at` datetime(3) DEFAULT NULL,
  `duration_ms` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sync_logs_type_idx` (`type`),
  KEY `sync_logs_status_idx` (`status`),
  KEY `sync_logs_started_at_idx` (`started_at`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sync_logs`
--

LOCK TABLES `sync_logs` WRITE;
/*!40000 ALTER TABLE `sync_logs` DISABLE KEYS */;
INSERT INTO `sync_logs` VALUES (1,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:12:51.169','2026-01-29 08:12:51.000',12),(2,'product_delete','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:23:13.659','2026-01-29 08:23:13.000',0),(3,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:23:46.597','2026-01-29 08:23:46.000',23),(4,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:36:02.888','2026-01-29 08:36:02.000',38),(5,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:50:30.852','2026-01-29 08:50:30.000',26),(6,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:50:33.944','2026-01-29 08:50:33.000',10),(7,'product_delete','pull','success',1,1,0,NULL,NULL,'2026-01-29 09:05:35.512','2026-01-29 09:05:35.000',0),(8,'product_delete','pull','success',1,1,0,NULL,NULL,'2026-01-29 09:05:39.302','2026-01-29 09:05:39.000',0),(9,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 09:11:17.873','2026-01-29 09:11:17.000',33),(10,'products','pull','error',1,0,1,'Prodotto M01026: \nInvalid `__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert()` invocation in\nD:\\Development\\gaurosa-site\\.next\\dev\\server\\chunks\\[root-of-the-server]__4e0ed698._.js:121:157\n\n  118 for (const product of products){\n  119     try {\n  120         // Upsert prodotto\n→ 121         await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert({\n                where: {\n                  mazgestId: 919\n                },\n                update: {\n                  code: \"M01026\",\n                  ean: null,\n                  name: \"10461808\",\n                  slug: \"10461808-m01026\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 1070.5,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:21:40.439Z\")\n                },\n                create: {\n                  mazgestId: 919,\n                  code: \"M01026\",\n                  ean: null,\n                  name: \"10461808\",\n                  slug: \"10461808-m01026\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  ~~~~~~~~\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 1070.5,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:21:40.439Z\"),\n              ?   loadType?: String | Null,\n              ?   mainCategory?: String | Null,\n              ?   subcategory?: String | Null,\n              ?   materialPrimary?: String | Null,\n              ?   materialColor?: String | Null,\n              ?   materialWeightGrams?: Decimal | Null,\n              ?   stoneMainType?: String | Null,\n              ?   stoneMainCarats?: Decimal | Null,\n              ?   stoneMainColor?: String | Null,\n              ?   stoneMainClarity?: String | Null,\n              ?   stoneMainCut?: String | Null,\n              ?   stoneMainCertificate?: String | Null,\n              ?   stonesSecondaryType?: String | Null,\n              ?   stonesSecondaryCount?: Int | Null,\n              ?   pearlType?: String | Null,\n              ?   pearlSizeMm?: Decimal | Null,\n              ?   pearlColor?: String | Null,\n              ?   sizeRingIt?: Int | Null,\n              ?   sizeBraceletCm?: Decimal | Null,\n              ?   sizeNecklaceCm?: Int | Null,\n              ?   sizeEarringMm?: Decimal | Null,\n              ?   ringType?: String | Null,\n              ?   ringStyle?: String | Null,\n              ?   earringType?: String | Null,\n              ?   braceletType?: String | Null,\n              ?   necklaceType?: String | Null,\n              ?   pendantType?: String | Null,\n              ?   watchGender?: String | Null,\n              ?   watchType?: String | Null,\n              ?   watchMovement?: String | Null,\n              ?   itemCondition?: String | Null,\n              ?   createdAt?: DateTime,\n              ?   updatedAt?: DateTime,\n              ?   supplier?: SupplierCreateNestedOneWithoutProductsInput,\n              ?   images?: ProductImageCreateNestedManyWithoutProductInput,\n              ?   variants?: ProductVariantCreateNestedManyWithoutProductInput,\n              ?   orderItems?: OrderItemCreateNestedManyWithoutProductInput\n                }\n              })\n\nUnknown argument `category`. Did you mean `subcategory`? Available options are marked with ?.',NULL,'2026-01-29 08:21:40.635','2026-01-29 08:21:40.631',196),(11,'products','pull','error',1,0,1,'Prodotto M01019: \nInvalid `__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert()` invocation in\nD:\\Development\\gaurosa-site\\.next\\dev\\server\\chunks\\[root-of-the-server]__4e0ed698._.js:121:157\n\n  118 for (const product of products){\n  119     try {\n  120         // Upsert prodotto\n→ 121         await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert({\n                where: {\n                  mazgestId: 916\n                },\n                update: {\n                  code: \"M01019\",\n                  ean: null,\n                  name: \"10522387\",\n                  slug: \"10522387-m01019\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 1564.25,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:22:32.193Z\")\n                },\n                create: {\n                  mazgestId: 916,\n                  code: \"M01019\",\n                  ean: null,\n                  name: \"10522387\",\n                  slug: \"10522387-m01019\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  ~~~~~~~~\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 1564.25,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:22:32.193Z\"),\n              ?   loadType?: String | Null,\n              ?   mainCategory?: String | Null,\n              ?   subcategory?: String | Null,\n              ?   materialPrimary?: String | Null,\n              ?   materialColor?: String | Null,\n              ?   materialWeightGrams?: Decimal | Null,\n              ?   stoneMainType?: String | Null,\n              ?   stoneMainCarats?: Decimal | Null,\n              ?   stoneMainColor?: String | Null,\n              ?   stoneMainClarity?: String | Null,\n              ?   stoneMainCut?: String | Null,\n              ?   stoneMainCertificate?: String | Null,\n              ?   stonesSecondaryType?: String | Null,\n              ?   stonesSecondaryCount?: Int | Null,\n              ?   pearlType?: String | Null,\n              ?   pearlSizeMm?: Decimal | Null,\n              ?   pearlColor?: String | Null,\n              ?   sizeRingIt?: Int | Null,\n              ?   sizeBraceletCm?: Decimal | Null,\n              ?   sizeNecklaceCm?: Int | Null,\n              ?   sizeEarringMm?: Decimal | Null,\n              ?   ringType?: String | Null,\n              ?   ringStyle?: String | Null,\n              ?   earringType?: String | Null,\n              ?   braceletType?: String | Null,\n              ?   necklaceType?: String | Null,\n              ?   pendantType?: String | Null,\n              ?   watchGender?: String | Null,\n              ?   watchType?: String | Null,\n              ?   watchMovement?: String | Null,\n              ?   itemCondition?: String | Null,\n              ?   createdAt?: DateTime,\n              ?   updatedAt?: DateTime,\n              ?   supplier?: SupplierCreateNestedOneWithoutProductsInput,\n              ?   images?: ProductImageCreateNestedManyWithoutProductInput,\n              ?   variants?: ProductVariantCreateNestedManyWithoutProductInput,\n              ?   orderItems?: OrderItemCreateNestedManyWithoutProductInput\n                }\n              })\n\nUnknown argument `category`. Did you mean `subcategory`? Available options are marked with ?.',NULL,'2026-01-29 08:22:32.400','2026-01-29 08:22:32.399',206),(12,'products','pull','error',1,0,1,'Prodotto M01022: \nInvalid `__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert()` invocation in\nD:\\Development\\gaurosa-site\\.next\\dev\\server\\chunks\\[root-of-the-server]__4e0ed698._.js:121:157\n\n  118 for (const product of products){\n  119     try {\n  120         // Upsert prodotto\n→ 121         await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert({\n                where: {\n                  mazgestId: 917\n                },\n                update: {\n                  code: \"M01022\",\n                  ean: null,\n                  name: \"10469156\",\n                  slug: \"10469156-m01022\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 1521.5,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:24:36.049Z\")\n                },\n                create: {\n                  mazgestId: 917,\n                  code: \"M01022\",\n                  ean: null,\n                  name: \"10469156\",\n                  slug: \"10469156-m01022\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  ~~~~~~~~\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 1521.5,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:24:36.049Z\"),\n              ?   loadType?: String | Null,\n              ?   mainCategory?: String | Null,\n              ?   subcategory?: String | Null,\n              ?   materialPrimary?: String | Null,\n              ?   materialColor?: String | Null,\n              ?   materialWeightGrams?: Decimal | Null,\n              ?   stoneMainType?: String | Null,\n              ?   stoneMainCarats?: Decimal | Null,\n              ?   stoneMainColor?: String | Null,\n              ?   stoneMainClarity?: String | Null,\n              ?   stoneMainCut?: String | Null,\n              ?   stoneMainCertificate?: String | Null,\n              ?   stonesSecondaryType?: String | Null,\n              ?   stonesSecondaryCount?: Int | Null,\n              ?   pearlType?: String | Null,\n              ?   pearlSizeMm?: Decimal | Null,\n              ?   pearlColor?: String | Null,\n              ?   sizeRingIt?: Int | Null,\n              ?   sizeBraceletCm?: Decimal | Null,\n              ?   sizeNecklaceCm?: Int | Null,\n              ?   sizeEarringMm?: Decimal | Null,\n              ?   ringType?: String | Null,\n              ?   ringStyle?: String | Null,\n              ?   earringType?: String | Null,\n              ?   braceletType?: String | Null,\n              ?   necklaceType?: String | Null,\n              ?   pendantType?: String | Null,\n              ?   watchGender?: String | Null,\n              ?   watchType?: String | Null,\n              ?   watchMovement?: String | Null,\n              ?   itemCondition?: String | Null,\n              ?   createdAt?: DateTime,\n              ?   updatedAt?: DateTime,\n              ?   supplier?: SupplierCreateNestedOneWithoutProductsInput,\n              ?   images?: ProductImageCreateNestedManyWithoutProductInput,\n              ?   variants?: ProductVariantCreateNestedManyWithoutProductInput,\n              ?   orderItems?: OrderItemCreateNestedManyWithoutProductInput\n                }\n              })\n\nUnknown argument `category`. Did you mean `subcategory`? Available options are marked with ?.',NULL,'2026-01-29 08:24:36.276','2026-01-29 08:24:36.270',224),(13,'products','pull','error',1,0,1,'Prodotto M01026: \nInvalid `__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert()` invocation in\nD:\\Development\\gaurosa-site\\.next\\dev\\server\\chunks\\[root-of-the-server]__4e0ed698._.js:121:157\n\n  118 for (const product of products){\n  119     try {\n  120         // Upsert prodotto\n→ 121         await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert({\n                where: {\n                  mazgestId: 919\n                },\n                update: {\n                  code: \"M01026\",\n                  ean: null,\n                  name: \"10461808\",\n                  slug: \"10461808-m01026\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 1070.5,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:24:59.538Z\")\n                },\n                create: {\n                  mazgestId: 919,\n                  code: \"M01026\",\n                  ean: null,\n                  name: \"10461808\",\n                  slug: \"10461808-m01026\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  ~~~~~~~~\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 1070.5,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:24:59.538Z\"),\n              ?   loadType?: String | Null,\n              ?   mainCategory?: String | Null,\n              ?   subcategory?: String | Null,\n              ?   materialPrimary?: String | Null,\n              ?   materialColor?: String | Null,\n              ?   materialWeightGrams?: Decimal | Null,\n              ?   stoneMainType?: String | Null,\n              ?   stoneMainCarats?: Decimal | Null,\n              ?   stoneMainColor?: String | Null,\n              ?   stoneMainClarity?: String | Null,\n              ?   stoneMainCut?: String | Null,\n              ?   stoneMainCertificate?: String | Null,\n              ?   stonesSecondaryType?: String | Null,\n              ?   stonesSecondaryCount?: Int | Null,\n              ?   pearlType?: String | Null,\n              ?   pearlSizeMm?: Decimal | Null,\n              ?   pearlColor?: String | Null,\n              ?   sizeRingIt?: Int | Null,\n              ?   sizeBraceletCm?: Decimal | Null,\n              ?   sizeNecklaceCm?: Int | Null,\n              ?   sizeEarringMm?: Decimal | Null,\n              ?   ringType?: String | Null,\n              ?   ringStyle?: String | Null,\n              ?   earringType?: String | Null,\n              ?   braceletType?: String | Null,\n              ?   necklaceType?: String | Null,\n              ?   pendantType?: String | Null,\n              ?   watchGender?: String | Null,\n              ?   watchType?: String | Null,\n              ?   watchMovement?: String | Null,\n              ?   itemCondition?: String | Null,\n              ?   createdAt?: DateTime,\n              ?   updatedAt?: DateTime,\n              ?   supplier?: SupplierCreateNestedOneWithoutProductsInput,\n              ?   images?: ProductImageCreateNestedManyWithoutProductInput,\n              ?   variants?: ProductVariantCreateNestedManyWithoutProductInput,\n              ?   orderItems?: OrderItemCreateNestedManyWithoutProductInput\n                }\n              })\n\nUnknown argument `category`. Did you mean `subcategory`? Available options are marked with ?.',NULL,'2026-01-29 08:24:59.769','2026-01-29 08:24:59.767',233),(14,'products','pull','error',1,0,1,'Prodotto M01024: \nInvalid `__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert()` invocation in\nD:\\Development\\gaurosa-site\\.next\\dev\\server\\chunks\\[root-of-the-server]__4e0ed698._.js:121:157\n\n  118 for (const product of products){\n  119     try {\n  120         // Upsert prodotto\n→ 121         await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert({\n                where: {\n                  mazgestId: 918\n                },\n                update: {\n                  code: \"M01024\",\n                  ean: null,\n                  name: \"GAAN23\",\n                  slug: \"gaan23-m01024\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 947,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:24:59.844Z\")\n                },\n                create: {\n                  mazgestId: 918,\n                  code: \"M01024\",\n                  ean: null,\n                  name: \"GAAN23\",\n                  slug: \"gaan23-m01024\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  ~~~~~~~~\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 947,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:24:59.844Z\"),\n              ?   loadType?: String | Null,\n              ?   mainCategory?: String | Null,\n              ?   subcategory?: String | Null,\n              ?   materialPrimary?: String | Null,\n              ?   materialColor?: String | Null,\n              ?   materialWeightGrams?: Decimal | Null,\n              ?   stoneMainType?: String | Null,\n              ?   stoneMainCarats?: Decimal | Null,\n              ?   stoneMainColor?: String | Null,\n              ?   stoneMainClarity?: String | Null,\n              ?   stoneMainCut?: String | Null,\n              ?   stoneMainCertificate?: String | Null,\n              ?   stonesSecondaryType?: String | Null,\n              ?   stonesSecondaryCount?: Int | Null,\n              ?   pearlType?: String | Null,\n              ?   pearlSizeMm?: Decimal | Null,\n              ?   pearlColor?: String | Null,\n              ?   sizeRingIt?: Int | Null,\n              ?   sizeBraceletCm?: Decimal | Null,\n              ?   sizeNecklaceCm?: Int | Null,\n              ?   sizeEarringMm?: Decimal | Null,\n              ?   ringType?: String | Null,\n              ?   ringStyle?: String | Null,\n              ?   earringType?: String | Null,\n              ?   braceletType?: String | Null,\n              ?   necklaceType?: String | Null,\n              ?   pendantType?: String | Null,\n              ?   watchGender?: String | Null,\n              ?   watchType?: String | Null,\n              ?   watchMovement?: String | Null,\n              ?   itemCondition?: String | Null,\n              ?   createdAt?: DateTime,\n              ?   updatedAt?: DateTime,\n              ?   supplier?: SupplierCreateNestedOneWithoutProductsInput,\n              ?   images?: ProductImageCreateNestedManyWithoutProductInput,\n              ?   variants?: ProductVariantCreateNestedManyWithoutProductInput,\n              ?   orderItems?: OrderItemCreateNestedManyWithoutProductInput\n                }\n              })\n\nUnknown argument `category`. Did you mean `subcategory`? Available options are marked with ?.',NULL,'2026-01-29 08:25:00.188','2026-01-29 08:25:00.186',347),(15,'products','pull','error',1,0,1,'Prodotto M01022: \nInvalid `__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert()` invocation in\nD:\\Development\\gaurosa-site\\.next\\dev\\server\\chunks\\[root-of-the-server]__4e0ed698._.js:121:157\n\n  118 for (const product of products){\n  119     try {\n  120         // Upsert prodotto\n→ 121         await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"default\"].product.upsert({\n                where: {\n                  mazgestId: 917\n                },\n                update: {\n                  code: \"M01022\",\n                  ean: null,\n                  name: \"10469156\",\n                  slug: \"10469156-m01022\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 1521.5,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:25:00.230Z\")\n                },\n                create: {\n                  mazgestId: 917,\n                  code: \"M01022\",\n                  ean: null,\n                  name: \"10469156\",\n                  slug: \"10469156-m01022\",\n                  description: null,\n                  category: \"produzione_propria\",\n                  ~~~~~~~~\n                  subCategory: null,\n                  macroCategory: null,\n                  price: 1521.5,\n                  compareAtPrice: null,\n                  stock: 1,\n                  stockStatus: \"in_stock\",\n                  brand: null,\n                  material: null,\n                  gender: null,\n                  seoTitle: null,\n                  seoDescription: null,\n                  descriptionIt: null,\n                  descriptionEn: null,\n                  isActive: true,\n                  isFeatured: false,\n                  syncedAt: new Date(\"2026-01-29T08:25:00.230Z\"),\n              ?   loadType?: String | Null,\n              ?   mainCategory?: String | Null,\n              ?   subcategory?: String | Null,\n              ?   materialPrimary?: String | Null,\n              ?   materialColor?: String | Null,\n              ?   materialWeightGrams?: Decimal | Null,\n              ?   stoneMainType?: String | Null,\n              ?   stoneMainCarats?: Decimal | Null,\n              ?   stoneMainColor?: String | Null,\n              ?   stoneMainClarity?: String | Null,\n              ?   stoneMainCut?: String | Null,\n              ?   stoneMainCertificate?: String | Null,\n              ?   stonesSecondaryType?: String | Null,\n              ?   stonesSecondaryCount?: Int | Null,\n              ?   pearlType?: String | Null,\n              ?   pearlSizeMm?: Decimal | Null,\n              ?   pearlColor?: String | Null,\n              ?   sizeRingIt?: Int | Null,\n              ?   sizeBraceletCm?: Decimal | Null,\n              ?   sizeNecklaceCm?: Int | Null,\n              ?   sizeEarringMm?: Decimal | Null,\n              ?   ringType?: String | Null,\n              ?   ringStyle?: String | Null,\n              ?   earringType?: String | Null,\n              ?   braceletType?: String | Null,\n              ?   necklaceType?: String | Null,\n              ?   pendantType?: String | Null,\n              ?   watchGender?: String | Null,\n              ?   watchType?: String | Null,\n              ?   watchMovement?: String | Null,\n              ?   itemCondition?: String | Null,\n              ?   createdAt?: DateTime,\n              ?   updatedAt?: DateTime,\n              ?   supplier?: SupplierCreateNestedOneWithoutProductsInput,\n              ?   images?: ProductImageCreateNestedManyWithoutProductInput,\n              ?   variants?: ProductVariantCreateNestedManyWithoutProductInput,\n              ?   orderItems?: OrderItemCreateNestedManyWithoutProductInput\n                }\n              })\n\nUnknown argument `category`. Did you mean `subcategory`? Available options are marked with ?.',NULL,'2026-01-29 08:25:00.440','2026-01-29 08:25:00.438',211),(16,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:30:49.212','2026-01-29 08:30:49.182',207),(17,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:30:49.325','2026-01-29 08:30:49.322',48),(18,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:30:49.417','2026-01-29 08:30:49.414',35),(19,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:38:37.366','2026-01-29 08:38:37.364',80),(20,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:38:37.426','2026-01-29 08:38:37.424',21),(21,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:38:37.488','2026-01-29 08:38:37.486',28),(22,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:40:43.263','2026-01-29 08:40:43.260',30),(23,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:40:43.361','2026-01-29 08:40:43.360',40),(24,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:40:43.466','2026-01-29 08:40:43.465',35),(25,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:54:18.094','2026-01-29 08:54:18.091',51),(26,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:54:18.217','2026-01-29 08:54:18.214',47),(27,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 08:54:18.293','2026-01-29 08:54:18.291',27),(28,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 10:55:18.884','2026-01-29 10:55:18.882',67),(29,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 10:55:18.969','2026-01-29 10:55:18.968',33),(30,'products','pull','success',1,1,0,NULL,NULL,'2026-01-29 10:55:19.020','2026-01-29 10:55:19.019',18);
/*!40000 ALTER TABLE `sync_logs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-29 15:35:10
