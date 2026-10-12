-- ============================================================
-- Enum replacement → use a CHECK constraint on the column
-- ============================================================

-- ============================================================
-- CreateTable: users
-- ============================================================
CREATE TABLE [users] (
    [id]         NVARCHAR(36)   NOT NULL,
    [name]       NVARCHAR(255)  NOT NULL,
    [email]      NVARCHAR(255)  NOT NULL,
    [password]   NVARCHAR(255)  NOT NULL,
    [role]       NVARCHAR(20)   NOT NULL CONSTRAINT [users_role_default] DEFAULT N'USER',
    [avatar]     NVARCHAR(500)  NULL,
    [phone]      NVARCHAR(50)   NULL,
    [address]    NVARCHAR(500)  NULL,
    [bio]        NVARCHAR(MAX)  NULL,
    [createdAt]  DATETIME2(3)   NOT NULL CONSTRAINT [users_createdAt_default] DEFAULT SYSUTCDATETIME(),
    [updatedAt]  DATETIME2(3)   NOT NULL,

    CONSTRAINT [users_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [users_role_check] CHECK ([role] IN (N'USER', N'ADMIN'))
);

-- ============================================================
-- CreateTable: chat_messages
-- ============================================================
CREATE TABLE [chat_messages] (
    [id]              NVARCHAR(36)   NOT NULL,
    [userId]          NVARCHAR(36)   NOT NULL,
    [conversationId]  NVARCHAR(36)   NOT NULL,
    [userMessage]     NVARCHAR(MAX)  NOT NULL,
    [botResponse]     NVARCHAR(MAX)  NOT NULL,
    [timestamp]       DATETIME2(3)   NOT NULL CONSTRAINT [chat_messages_timestamp_default] DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [chat_messages_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: profiles
-- ============================================================
CREATE TABLE [profiles] (
    [id]            NVARCHAR(36)   NOT NULL,
    [userId]        NVARCHAR(36)   NOT NULL,
    [shopName]      NVARCHAR(255)  NULL,
    [shopDesc]      NVARCHAR(MAX)  NULL,
    [logo]          NVARCHAR(500)  NULL,
    [phone]         NVARCHAR(50)   NULL,
    [isVerified]    BIT            NOT NULL CONSTRAINT [profiles_isVerified_default] DEFAULT 0,
    [totalSales]    INT            NOT NULL CONSTRAINT [profiles_totalSales_default] DEFAULT 0,
    [address]       NVARCHAR(500)  NULL,
    [banner]        NVARCHAR(500)  NULL,
    [isAdmin]       BIT            NOT NULL CONSTRAINT [profiles_isAdmin_default] DEFAULT 0,
    [adminRole]     NVARCHAR(50)   NULL,
    [permissions]   NVARCHAR(MAX)  NULL,  -- JSON array string
    [lastLogin]     DATETIME2(3)   NULL,
    [status]        NVARCHAR(20)   NOT NULL CONSTRAINT [profiles_status_default] DEFAULT N'active',
    [createdAt]     DATETIME2(3)   NOT NULL CONSTRAINT [profiles_createdAt_default] DEFAULT SYSUTCDATETIME(),
    [updatedAt]     DATETIME2(3)   NOT NULL,

    CONSTRAINT [profiles_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: admin_profiles
-- ============================================================
CREATE TABLE [admin_profiles] (
    [id]          NVARCHAR(36)   NOT NULL,
    [userId]      NVARCHAR(36)   NOT NULL,
    [permissions] NVARCHAR(MAX)  NULL,  -- JSON array string
    [department]  NVARCHAR(255)  NULL,
    [createdAt]   DATETIME2(3)   NOT NULL CONSTRAINT [admin_profiles_createdAt_default] DEFAULT SYSUTCDATETIME(),
    [updatedAt]   DATETIME2(3)   NOT NULL,

    CONSTRAINT [admin_profiles_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: categories
-- ============================================================
CREATE TABLE [categories] (
    [id]          NVARCHAR(36)   NOT NULL,
    [name]        NVARCHAR(255)  NOT NULL,
    [slug]        NVARCHAR(255)  NOT NULL,
    [description] NVARCHAR(MAX)  NULL,
    [image]       NVARCHAR(500)  NULL,
    [icon]        NVARCHAR(100)  NULL,
    [color]       NVARCHAR(50)   NULL,
    [parentId]    NVARCHAR(36)   NULL,
    [createdBy]   NVARCHAR(36)   NULL,
    [createdAt]   DATETIME2(3)   NOT NULL CONSTRAINT [categories_createdAt_default] DEFAULT SYSUTCDATETIME(),
    [updatedAt]   DATETIME2(3)   NOT NULL,

    CONSTRAINT [categories_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: products
-- ============================================================
CREATE TABLE [products] (
    [id]                 NVARCHAR(36)    NOT NULL,
    [name]               NVARCHAR(255)   NOT NULL,
    [slug]               NVARCHAR(255)   NOT NULL,
    [description]        NVARCHAR(MAX)   NOT NULL,
    [price]              DECIMAL(10,2)   NOT NULL,
    [discountPrice]      DECIMAL(10,2)   NULL,
    [stock]              INT             NOT NULL CONSTRAINT [products_stock_default] DEFAULT 0,
    [sku]                NVARCHAR(100)   NOT NULL,
    [images]             NVARCHAR(MAX)   NULL,  -- JSON array string
    [categoryId]         NVARCHAR(36)    NOT NULL,
    [subCategoryId]      NVARCHAR(36)    NULL,
    [tags]               NVARCHAR(MAX)   NULL,  -- JSON array string
    [warranty]           NVARCHAR(255)   NULL,
    [videoUrl]           NVARCHAR(500)   NULL,
    [unitOfMeasurement]  NVARCHAR(50)    NOT NULL CONSTRAINT [products_unit_default] DEFAULT N'pcs',
    [sizes]              NVARCHAR(255)   NULL,
    [colors]             NVARCHAR(255)   NULL,
    [brand]              NVARCHAR(255)   NULL,
    [weight]             FLOAT           NULL,
    [estimatedDelivery]  NVARCHAR(255)   NULL,
    [durationTime]       NVARCHAR(20)    NULL CONSTRAINT [products_duration_default] DEFAULT N'1h',
    [pricePerUnit]       DECIMAL(10,2)   NULL,
    [createdAt]          DATETIME2(3)    NOT NULL CONSTRAINT [products_createdAt_default] DEFAULT SYSUTCDATETIME(),
    [updatedAt]          DATETIME2(3)    NOT NULL,

    CONSTRAINT [products_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: carts
-- ============================================================
CREATE TABLE [carts] (
    [id]        NVARCHAR(36)  NOT NULL,
    [userId]    NVARCHAR(36)  NOT NULL,
    [createdAt] DATETIME2(3)  NOT NULL CONSTRAINT [carts_createdAt_default] DEFAULT SYSUTCDATETIME(),
    [updatedAt] DATETIME2(3)  NOT NULL,

    CONSTRAINT [carts_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: cart_items
-- ============================================================
CREATE TABLE [cart_items] (
    [id]        NVARCHAR(36)  NOT NULL,
    [userId]    NVARCHAR(36)  NOT NULL,
    [cartId]    NVARCHAR(36)  NOT NULL,
    [productId] NVARCHAR(36)  NOT NULL,
    [quantity]  INT           NOT NULL CONSTRAINT [cart_items_qty_default] DEFAULT 1,

    CONSTRAINT [cart_items_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: orders
-- ============================================================
CREATE TABLE [orders] (
    [id]          NVARCHAR(36)   NOT NULL,
    [orderNumber] INT            NOT NULL IDENTITY(1,1),
    [userId]      NVARCHAR(36)   NOT NULL,
    [total]       DECIMAL(10,2)  NOT NULL,
    [addressId]   NVARCHAR(36)   NOT NULL,
    [notes]       NVARCHAR(MAX)  NULL,
    [createdAt]   DATETIME2(3)   NOT NULL CONSTRAINT [orders_createdAt_default] DEFAULT SYSUTCDATETIME(),
    [updatedAt]   DATETIME2(3)   NOT NULL,

    CONSTRAINT [orders_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: order_items
-- ============================================================
CREATE TABLE [order_items] (
    [id]        NVARCHAR(36)   NOT NULL,
    [orderId]   NVARCHAR(36)   NOT NULL,
    [productId] NVARCHAR(36)   NOT NULL,
    [quantity]  INT            NOT NULL,
    [price]     DECIMAL(10,2)  NOT NULL,

    CONSTRAINT [order_items_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: reviews
-- ============================================================
CREATE TABLE [reviews] (
    [id]        NVARCHAR(36)  NOT NULL,
    [userId]    NVARCHAR(36)  NOT NULL,
    [productId] NVARCHAR(36)  NOT NULL,
    [rating]    INT           NOT NULL,
    [comment]   NVARCHAR(MAX) NULL,
    [createdAt] DATETIME2(3)  NOT NULL CONSTRAINT [reviews_createdAt_default] DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [reviews_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: addresses
-- ============================================================
CREATE TABLE [addresses] (
    [id]        NVARCHAR(36)   NOT NULL,
    [userId]    NVARCHAR(36)   NOT NULL,
    [fullName]  NVARCHAR(255)  NOT NULL,
    [phone]     NVARCHAR(50)   NOT NULL,
    [street]    NVARCHAR(255)  NOT NULL,
    [city]      NVARCHAR(255)  NOT NULL,
    [state]     NVARCHAR(255)  NOT NULL,
    [zip]       NVARCHAR(20)   NOT NULL,
    [country]   NVARCHAR(100)  NOT NULL CONSTRAINT [addresses_country_default] DEFAULT N'Ethiopia',
    [isDefault] BIT            NOT NULL CONSTRAINT [addresses_isDefault_default] DEFAULT 0,

    CONSTRAINT [addresses_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: articles
-- ============================================================
CREATE TABLE [articles] (
    [id]           NVARCHAR(36)   NOT NULL,
    [title]        NVARCHAR(500)  NOT NULL,
    [author]       NVARCHAR(255)  NOT NULL,
    [summary]      NVARCHAR(MAX)  NULL,
    [content]      NVARCHAR(MAX)  NOT NULL,
    [note]         NVARCHAR(MAX)  NULL,
    [pdfUrl]       NVARCHAR(500)  NULL,
    [pdfFileName]  NVARCHAR(255)  NULL,
    [pdfFileSize]  INT            NULL,
    [views]        INT            NOT NULL CONSTRAINT [articles_views_default] DEFAULT 0,
    [downloads]    INT            NOT NULL CONSTRAINT [articles_downloads_default] DEFAULT 0,
    [tags]         NVARCHAR(MAX)  NULL,  -- JSON array string
    [createdBy]    NVARCHAR(36)   NULL,
    [publishedAt]  DATETIME2(3)   NOT NULL CONSTRAINT [articles_publishedAt_default] DEFAULT SYSUTCDATETIME(),
    [createdAt]    DATETIME2(3)   NOT NULL CONSTRAINT [articles_createdAt_default] DEFAULT SYSUTCDATETIME(),
    [updatedAt]    DATETIME2(3)   NOT NULL,

    CONSTRAINT [articles_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- CreateTable: settings
-- ============================================================
CREATE TABLE [settings] (
    [id]                    NVARCHAR(36)   NOT NULL,
    [siteName]              NVARCHAR(255)  NOT NULL CONSTRAINT [settings_siteName_default] DEFAULT N'Alemayehu Plastic Manufacturing',
    [siteDescription]       NVARCHAR(MAX)  NULL CONSTRAINT [settings_siteDescription_default] DEFAULT N'Quality plastic products manufactured in Ethiopia',
    [adminEmail]            NVARCHAR(255)  NOT NULL CONSTRAINT [settings_adminEmail_default] DEFAULT N'admin@alemayehplastic.com',
    [adminPhone]            NVARCHAR(50)   NULL CONSTRAINT [settings_adminPhone_default] DEFAULT N'+251 900 000 000',
    [address]               NVARCHAR(500)  NULL CONSTRAINT [settings_address_default] DEFAULT N'Bahir Dar, Ethiopia',
    [timezone]              NVARCHAR(50)   NOT NULL CONSTRAINT [settings_timezone_default] DEFAULT N'Africa/Addis_Ababa',
    [dateFormat]            NVARCHAR(20)   NOT NULL CONSTRAINT [settings_dateFormat_default] DEFAULT N'MM/DD/YYYY',
    [storeName]             NVARCHAR(255)  NOT NULL CONSTRAINT [settings_storeName_default] DEFAULT N'Alemayehu Plastic Manufacturing',
    [storeEmail]            NVARCHAR(255)  NOT NULL CONSTRAINT [settings_storeEmail_default] DEFAULT N'info@alemayehplastic.com',
    [storePhone]            NVARCHAR(50)   NULL CONSTRAINT [settings_storePhone_default] DEFAULT N'+251 900 000 000',
    [storeAddress]          NVARCHAR(500)  NULL CONSTRAINT [settings_storeAddress_default] DEFAULT N'Bahir Dar, Ethiopia',
    [currency]              NVARCHAR(10)   NOT NULL CONSTRAINT [settings_currency_default] DEFAULT N'ETB',
    [taxRate]               FLOAT          NOT NULL CONSTRAINT [settings_taxRate_default] DEFAULT 15,
    [logo]                  NVARCHAR(500)  NULL CONSTRAINT [settings_logo_default] DEFAULT N'',
    [favicon]               NVARCHAR(500)  NULL CONSTRAINT [settings_favicon_default] DEFAULT N'',
    [twoFactorAuth]         BIT            NOT NULL CONSTRAINT [settings_twoFactor_default] DEFAULT 0,
    [sessionTimeout]        INT            NOT NULL CONSTRAINT [settings_sessionTimeout_default] DEFAULT 60,
    [emailNotifications]    BIT            NOT NULL CONSTRAINT [settings_emailNotif_default] DEFAULT 1,
    [orderNotifications]    BIT            NOT NULL CONSTRAINT [settings_orderNotif_default] DEFAULT 1,
    [productNotifications]  BIT            NOT NULL CONSTRAINT [settings_productNotif_default] DEFAULT 1,
    [userNotifications]     BIT            NOT NULL CONSTRAINT [settings_userNotif_default] DEFAULT 1,
    [marketingEmails]       BIT            NOT NULL CONSTRAINT [settings_marketing_default] DEFAULT 0,
    [themeColor]            NVARCHAR(20)   NOT NULL CONSTRAINT [settings_themeColor_default] DEFAULT N'#e0a83c',
    [darkMode]              BIT            NOT NULL CONSTRAINT [settings_darkMode_default] DEFAULT 0,
    [contactEmail]          NVARCHAR(255)  NULL CONSTRAINT [settings_contactEmail_default] DEFAULT N'support@alemayehplastic.com',
    [contactPhone]          NVARCHAR(50)   NULL CONSTRAINT [settings_contactPhone_default] DEFAULT N'+251 900 000 000',
    [contactAddress]        NVARCHAR(500)  NULL CONSTRAINT [settings_contactAddress_default] DEFAULT N'Bahir Dar, Ethiopia',
    [contactHours]          NVARCHAR(255)  NULL CONSTRAINT [settings_contactHours_default] DEFAULT N'Mon-Sat: 8:00 AM - 6:00 PM',
    [contactMapEmbed]       NVARCHAR(MAX)  NULL CONSTRAINT [settings_mapEmbed_default] DEFAULT N'',
    [enableContactForm]     BIT            NOT NULL CONSTRAINT [settings_contactForm_default] DEFAULT 1,
    [enableWhatsApp]        BIT            NOT NULL CONSTRAINT [settings_whatsapp_default] DEFAULT 1,
    [whatsAppNumber]        NVARCHAR(50)   NULL CONSTRAINT [settings_whatsappNum_default] DEFAULT N'+251900000000',
    [enableLiveChat]        BIT            NOT NULL CONSTRAINT [settings_liveChat_default] DEFAULT 0,
    [emergencyPhone]        NVARCHAR(50)   NULL CONSTRAINT [settings_emergency_default] DEFAULT N'+251 900 000 000',
    [supportEmail]          NVARCHAR(255)  NULL CONSTRAINT [settings_supportEmail_default] DEFAULT N'support@alemayehplastic.com',
    [infoEmail]             NVARCHAR(255)  NULL CONSTRAINT [settings_infoEmail_default] DEFAULT N'info@alemayehplastic.com',
    [createdAt]             DATETIME2(3)   NOT NULL CONSTRAINT [settings_createdAt_default] DEFAULT SYSUTCDATETIME(),
    [updatedAt]             DATETIME2(3)   NOT NULL,

    CONSTRAINT [settings_pkey] PRIMARY KEY ([id])
);

-- ============================================================
-- Indexes
-- ============================================================

-- users
CREATE UNIQUE INDEX [users_email_key] ON [users]([email]);
CREATE INDEX [users_role_idx] ON [users]([role]);
CREATE INDEX [users_createdAt_idx] ON [users]([createdAt]);

-- chat_messages
CREATE INDEX [chat_messages_userId_idx] ON [chat_messages]([userId]);
CREATE INDEX [chat_messages_conversationId_idx] ON [chat_messages]([conversationId]);
CREATE INDEX [chat_messages_timestamp_idx] ON [chat_messages]([timestamp]);

-- profiles
CREATE UNIQUE INDEX [profiles_userId_key] ON [profiles]([userId]);

-- admin_profiles
CREATE UNIQUE INDEX [admin_profiles_userId_key] ON [admin_profiles]([userId]);

-- categories
CREATE UNIQUE INDEX [categories_name_key] ON [categories]([name]);
CREATE UNIQUE INDEX [categories_slug_key] ON [categories]([slug]);

-- products
CREATE UNIQUE INDEX [products_slug_key] ON [products]([slug]);
CREATE UNIQUE INDEX [products_sku_key] ON [products]([sku]);
CREATE INDEX [products_categoryId_idx] ON [products]([categoryId]);
CREATE INDEX [products_sku_idx] ON [products]([sku]);

-- carts
CREATE UNIQUE INDEX [carts_userId_key] ON [carts]([userId]);

-- cart_items
CREATE UNIQUE INDEX [cart_items_userId_productId_key] ON [cart_items]([userId], [productId]);

-- orders
CREATE UNIQUE INDEX [orders_orderNumber_key] ON [orders]([orderNumber]);
CREATE INDEX [orders_userId_idx] ON [orders]([userId]);
CREATE INDEX [orders_orderNumber_idx] ON [orders]([orderNumber]);
CREATE INDEX [orders_createdAt_idx] ON [orders]([createdAt]);

-- reviews
CREATE UNIQUE INDEX [reviews_userId_productId_key] ON [reviews]([userId], [productId]);

-- addresses
CREATE INDEX [addresses_userId_idx] ON [addresses]([userId]);

-- articles
CREATE INDEX [articles_author_idx] ON [articles]([author]);
CREATE INDEX [articles_createdBy_idx] ON [articles]([createdBy]);

-- ============================================================
-- Foreign Keys
-- ============================================================

ALTER TABLE [chat_messages] ADD CONSTRAINT [chat_messages_userId_fkey]
    FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [profiles] ADD CONSTRAINT [profiles_userId_fkey]
    FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [admin_profiles] ADD CONSTRAINT [admin_profiles_userId_fkey]
    FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [categories] ADD CONSTRAINT [categories_parentId_fkey]
    FOREIGN KEY ([parentId]) REFERENCES [categories]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE [categories] ADD CONSTRAINT [categories_createdBy_fkey]
    FOREIGN KEY ([createdBy]) REFERENCES [users]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE [products] ADD CONSTRAINT [products_categoryId_fkey]
    FOREIGN KEY ([categoryId]) REFERENCES [categories]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE [products] ADD CONSTRAINT [products_subCategoryId_fkey]
    FOREIGN KEY ([subCategoryId]) REFERENCES [categories]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE [cart_items] ADD CONSTRAINT [cart_items_userId_fkey]
    FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [cart_items] ADD CONSTRAINT [cart_items_cartId_fkey]
    FOREIGN KEY ([cartId]) REFERENCES [carts]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [cart_items] ADD CONSTRAINT [cart_items_productId_fkey]
    FOREIGN KEY ([productId]) REFERENCES [products]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [orders] ADD CONSTRAINT [orders_userId_fkey]
    FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE [orders] ADD CONSTRAINT [orders_addressId_fkey]
    FOREIGN KEY ([addressId]) REFERENCES [addresses]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE [order_items] ADD CONSTRAINT [order_items_orderId_fkey]
    FOREIGN KEY ([orderId]) REFERENCES [orders]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [order_items] ADD CONSTRAINT [order_items_productId_fkey]
    FOREIGN KEY ([productId]) REFERENCES [products]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE [reviews] ADD CONSTRAINT [reviews_userId_fkey]
    FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE [reviews] ADD CONSTRAINT [reviews_productId_fkey]
    FOREIGN KEY ([productId]) REFERENCES [products]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE [addresses] ADD CONSTRAINT [addresses_userId_fkey]
    FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [articles] ADD CONSTRAINT [articles_createdBy_fkey]
    FOREIGN KEY ([createdBy]) REFERENCES [users]([id]) ON DELETE SET NULL ON UPDATE CASCADE;