-- Shutter Database: Initial Schema Migration
-- Generated from drizzle-orm schema definitions
-- MySQL dialect

-- Users Table
CREATE TABLE `users` (
  `id` serial PRIMARY KEY NOT NULL,
  `unionId` varchar(255) NOT NULL,
  `name` varchar(255),
  `email` varchar(320),
  `avatar` text,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT now(),
  `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE now(),
  `lastSignInAt` timestamp NOT NULL DEFAULT now(),
  CONSTRAINT `users_unionId_unique` UNIQUE (`unionId`)
);

-- Retailers Table
CREATE TABLE `retailers` (
  `id` serial PRIMARY KEY NOT NULL,
  `userId` bigint unsigned NOT NULL,
  `storeName` varchar(255) NOT NULL,
  `ownerName` varchar(255) NOT NULL,
  `gstin` varchar(15) NOT NULL,
  `gstinVerified` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `phone` varchar(20),
  `email` varchar(320),
  `address` text,
  `city` varchar(100),
  `state` varchar(100),
  `pincode` varchar(10),
  `latitude` decimal(10,7),
  `longitude` decimal(10,7),
  `geohash` varchar(12),
  `catchmentRadius` int NOT NULL DEFAULT 5,
  `subscriptionTier` enum('free','pro') NOT NULL DEFAULT 'free',
  `subscriptionStatus` enum('active','inactive','trial') NOT NULL DEFAULT 'trial',
  `isActive` enum('active','inactive') NOT NULL DEFAULT 'active',
  `upiId` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT now(),
  `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE now(),
  CONSTRAINT `retailers_gstin_unique` UNIQUE (`gstin`)
);

CREATE INDEX `retailer_user_idx` ON `retailers` (`userId`);
CREATE INDEX `retailer_geohash_idx` ON `retailers` (`geohash`);
CREATE INDEX `retailer_city_idx` ON `retailers` (`city`);
CREATE INDEX `retailer_gstin_idx` ON `retailers` (`gstin`);

-- Products Table
CREATE TABLE `products` (
  `id` serial PRIMARY KEY NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `subcategory` varchar(100),
  `barcode` varchar(50),
  `mrp` decimal(10,2) NOT NULL,
  `gstRate` decimal(5,2) DEFAULT '0',
  `unit` varchar(20) DEFAULT 'pcs',
  `description` text,
  `imageUrl` text,
  `isActive` enum('active','inactive') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT now(),
  CONSTRAINT `products_barcode_unique` UNIQUE (`barcode`)
);

CREATE INDEX `product_category_idx` ON `products` (`category`);
CREATE INDEX `product_barcode_idx` ON `products` (`barcode`);

-- Inventory Table
CREATE TABLE `inventory` (
  `id` serial PRIMARY KEY NOT NULL,
  `retailerId` bigint unsigned NOT NULL,
  `productId` bigint unsigned NOT NULL,
  `quantity` int DEFAULT 0 NOT NULL,
  `lowStockThreshold` int DEFAULT 10 NOT NULL,
  `costPrice` decimal(10,2),
  `sellingPrice` decimal(10,2),
  `surplusFlag` enum('normal','surplus','dead_stock') NOT NULL DEFAULT 'normal',
  `surplusQuantity` int DEFAULT 0,
  `expiryDate` varchar(64),
  `lastRestockedAt` timestamp,
  `aiForecastData` json,
  `createdAt` timestamp NOT NULL DEFAULT now(),
  `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE now()
);

CREATE INDEX `inventory_retailer_idx` ON `inventory` (`retailerId`);
CREATE INDEX `inventory_product_idx` ON `inventory` (`productId`);
CREATE INDEX `inventory_surplus_idx` ON `inventory` (`surplusFlag`);

-- Bills Table
CREATE TABLE `bills` (
  `id` serial PRIMARY KEY NOT NULL,
  `retailerId` bigint unsigned NOT NULL,
  `billNumber` varchar(50) NOT NULL,
  `customerPhone` varchar(20),
  `subtotal` decimal(12,2) NOT NULL,
  `gstAmount` decimal(12,2) DEFAULT '0',
  `discount` decimal(12,2) DEFAULT '0',
  `total` decimal(12,2) NOT NULL,
  `paymentMethod` enum('cash','upi','card') NOT NULL,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'completed',
  `createdAt` timestamp NOT NULL DEFAULT now()
);

CREATE INDEX `bill_retailer_idx` ON `bills` (`retailerId`);
CREATE INDEX `bill_created_idx` ON `bills` (`createdAt`);

-- Bill Items Table
CREATE TABLE `bill_items` (
  `id` serial PRIMARY KEY NOT NULL,
  `billId` bigint unsigned NOT NULL,
  `productId` bigint unsigned NOT NULL,
  `productName` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `unitPrice` decimal(10,2) NOT NULL,
  `gstRate` decimal(5,2) DEFAULT '0',
  `lineTotal` decimal(12,2) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT now()
);

CREATE INDEX `billitem_bill_idx` ON `bill_items` (`billId`);

-- Trade Opportunities Table
CREATE TABLE `trade_opportunities` (
  `id` serial PRIMARY KEY NOT NULL,
  `sellerRetailerId` bigint unsigned NOT NULL,
  `buyerRetailerId` bigint unsigned NOT NULL,
  `productId` bigint unsigned NOT NULL,
  `quantity` int NOT NULL,
  `sellerPrice` decimal(10,2) NOT NULL,
  `matchScore` decimal(5,2) NOT NULL,
  `distance` decimal(8,2),
  `status` enum('pending','seller_confirmed','buyer_confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT now(),
  `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE now()
);

CREATE INDEX `trade_seller_idx` ON `trade_opportunities` (`sellerRetailerId`);
CREATE INDEX `trade_buyer_idx` ON `trade_opportunities` (`buyerRetailerId`);
CREATE INDEX `trade_status_idx` ON `trade_opportunities` (`status`);

-- Pindrops Table
CREATE TABLE `pindrops` (
  `id` serial PRIMARY KEY NOT NULL,
  `productName` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `geohash` varchar(12) NOT NULL,
  `deviceId` varchar(64) NOT NULL,
  `note` text,
  `urgency` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `isActive` enum('active','resolved') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT now()
);

CREATE INDEX `pindrop_geohash_idx` ON `pindrops` (`geohash`);
CREATE INDEX `pindrop_category_idx` ON `pindrops` (`category`);
CREATE INDEX `pindrop_created_idx` ON `pindrops` (`createdAt`);
CREATE INDEX `pindrop_device_idx` ON `pindrops` (`deviceId`);

-- Campaigns Table
CREATE TABLE `campaigns` (
  `id` serial PRIMARY KEY NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `requestType` enum('new_store','product_category','brand') NOT NULL,
  `category` varchar(100),
  `targetSignatures` int DEFAULT 50 NOT NULL,
  `currentSignatures` int DEFAULT 0 NOT NULL,
  `latitude` decimal(10,7),
  `longitude` decimal(10,7),
  `geohash` varchar(12),
  `status` enum('active','achieved','closed') NOT NULL DEFAULT 'active',
  `creatorDeviceId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT now(),
  `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE now()
);

CREATE INDEX `campaign_geohash_idx` ON `campaigns` (`geohash`);
CREATE INDEX `campaign_status_idx` ON `campaigns` (`status`);

-- Campaign Signatures Table
CREATE TABLE `campaign_signatures` (
  `id` serial PRIMARY KEY NOT NULL,
  `campaignId` bigint unsigned NOT NULL,
  `deviceId` varchar(64) NOT NULL,
  `note` text,
  `createdAt` timestamp NOT NULL DEFAULT now()
);

CREATE INDEX `sig_campaign_idx` ON `campaign_signatures` (`campaignId`);
CREATE INDEX `sig_device_idx` ON `campaign_signatures` (`deviceId`);

-- Demand Aggregates Table
CREATE TABLE `demand_aggregates` (
  `id` serial PRIMARY KEY NOT NULL,
  `geohash` varchar(7) NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `category` varchar(100) NOT NULL,
  `demandScore` int DEFAULT 0 NOT NULL,
  `pindropCount` int DEFAULT 0 NOT NULL,
  `searchCount` int DEFAULT 0 NOT NULL,
  `campaignCount` int DEFAULT 0 NOT NULL,
  `successProbability` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `computedAt` timestamp NOT NULL DEFAULT now()
);

CREATE INDEX `da_geohash_idx` ON `demand_aggregates` (`geohash`);
CREATE INDEX `da_category_idx` ON `demand_aggregates` (`category`);
CREATE INDEX `da_score_idx` ON `demand_aggregates` (`demandScore`);

-- Restock Recommendations Table
CREATE TABLE `restock_recommendations` (
  `id` serial PRIMARY KEY NOT NULL,
  `retailerId` bigint unsigned NOT NULL,
  `productId` bigint unsigned NOT NULL,
  `currentStock` int NOT NULL,
  `recommendedQuantity` int NOT NULL,
  `predictedDemand` int NOT NULL,
  `confidence` decimal(5,2) NOT NULL,
  `reason` text,
  `status` enum('pending','approved','rejected','ordered') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT now(),
  `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE now()
);

CREATE INDEX `rec_retailer_idx` ON `restock_recommendations` (`retailerId`);
CREATE INDEX `rec_status_idx` ON `restock_recommendations` (`status`);

-- Genie Queries Table
CREATE TABLE `genie_queries` (
  `id` serial PRIMARY KEY NOT NULL,
  `retailerId` bigint unsigned NOT NULL,
  `query` text NOT NULL,
  `locationContext` json,
  `aiResponse` text,
  `insights` json,
  `createdAt` timestamp NOT NULL DEFAULT now()
);

CREATE INDEX `genie_retailer_idx` ON `genie_queries` (`retailerId`);

-- Add FULLTEXT index for product search (fixes LIKE scan performance issue)
CREATE FULLTEXT INDEX `product_name_fulltext` ON `products` (`name`, `category`, `description`);
