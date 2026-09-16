-- 1. Create Tables
CREATE TABLE [users] (
    [id] NVARCHAR(450) NOT NULL,
    [name] NVARCHAR(MAX) NOT NULL,
    [email] NVARCHAR(450) NOT NULL,
    [password] NVARCHAR(MAX) NOT NULL,
    [role] NVARCHAR(50) NOT NULL DEFAULT ('USER'),
    [avatar] NVARCHAR(MAX),
    [phone] NVARCHAR(MAX),
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [users_role_check] CHECK ([role] IN ('USER', 'ADMIN'))
);

CREATE TABLE [profiles] (
    [id] NVARCHAR(450) NOT NULL,
    [userId] NVARCHAR(450) NOT NULL,
    [shopName] NVARCHAR(MAX),
    [shopDesc] NVARCHAR(MAX),
    [logo] NVARCHAR(MAX),
    [phone] NVARCHAR(MAX),
    [isVerified] BIT NOT NULL DEFAULT 0,
    [totalSales] INT NOT NULL DEFAULT 0,
    [address] NVARCHAR(MAX),
    [banner] NVARCHAR(MAX),
    [isAdmin] BIT NOT NULL DEFAULT 0,
    [adminRole] NVARCHAR(MAX),
    [permissions] NVARCHAR(MAX),
    [lastLogin] DATETIME2,
    [status] NVARCHAR(50) NOT NULL DEFAULT ('active'),
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [profiles_pkey] PRIMARY KEY ([id])
);

CREATE TABLE [admin_profiles] (
    [id] NVARCHAR(450) NOT NULL,
    [userId] NVARCHAR(450) NOT NULL,
    [permissions] NVARCHAR(MAX),
    [department] NVARCHAR(MAX),
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [admin_profiles_pkey] PRIMARY KEY ([id])
);

CREATE TABLE [categories] (
    [id] NVARCHAR(450) NOT NULL,
    [name] NVARCHAR(450) NOT NULL,
    [slug] NVARCHAR(450) NOT NULL,
    [description] NVARCHAR(MAX),
    [image] NVARCHAR(MAX),
    [icon] NVARCHAR(MAX),
    [color] NVARCHAR(MAX),
    [parentId] NVARCHAR(450),
    [status] NVARCHAR(50) NOT NULL DEFAULT ('PENDING'),
    [createdBy] NVARCHAR(450),
    [approvedBy] NVARCHAR(450),
    [approvedAt] DATETIME2,
    [rejectedAt] DATETIME2,
    [rejectionReason] NVARCHAR(MAX),
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [categories_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [categories_status_check] CHECK ([status] IN ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE', 'HIDDEN'))
);

CREATE TABLE [products] (
    [id] NVARCHAR(450) NOT NULL,
    [name] NVARCHAR(MAX) NOT NULL,
    [slug] NVARCHAR(450) NOT NULL,
    [description] NVARCHAR(MAX) NOT NULL,
    [price] DECIMAL(10,2) NOT NULL,
    [discountPrice] DECIMAL(10,2),
    [stock] INT NOT NULL DEFAULT 0,
    [sku] NVARCHAR(450) NOT NULL,
    [images] NVARCHAR(MAX),
    [status] NVARCHAR(50) NOT NULL DEFAULT ('PENDING'),
    [visibility] NVARCHAR(50) NOT NULL DEFAULT ('VISIBLE'),
    [adminNote] NVARCHAR(MAX),
    [categoryId] NVARCHAR(450) NOT NULL,
    [subCategoryId] NVARCHAR(450),
    [tags] NVARCHAR(MAX),
    [warranty] NVARCHAR(MAX),
    [videoUrl] NVARCHAR(MAX),
    [unitOfMeasurement] NVARCHAR(50) NOT NULL DEFAULT ('pcs'),
    [sizes] NVARCHAR(MAX),
    [colors] NVARCHAR(MAX),
    [brand] NVARCHAR(MAX),
    [weight] FLOAT,
    [estimatedDelivery] NVARCHAR(MAX),
    [rejectionReason] NVARCHAR(MAX),
    [durationTime] NVARCHAR(50) DEFAULT ('1h'),
    [pricePerUnit] DECIMAL(10,2),
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [products_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [products_status_check] CHECK ([status] IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT [products_visibility_check] CHECK ([visibility] IN ('VISIBLE', 'HIDDEN'))
);

CREATE TABLE [carts] (
    [id] NVARCHAR(450) NOT NULL,
    [userId] NVARCHAR(450) NOT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [carts_pkey] PRIMARY KEY ([id])
);

CREATE TABLE [cart_items] (
    [id] NVARCHAR(450) NOT NULL,
    [userId] NVARCHAR(450) NOT NULL,
    [cartId] NVARCHAR(450) NOT NULL,
    [productId] NVARCHAR(450) NOT NULL,
    [quantity] INT NOT NULL DEFAULT 1,
    CONSTRAINT [cart_items_pkey] PRIMARY KEY ([id])
);

CREATE TABLE [orders] (
    [id] NVARCHAR(450) NOT NULL,
    [userId] NVARCHAR(450) NOT NULL,
    [total] DECIMAL(10,2) NOT NULL,
    [status] NVARCHAR(50) NOT NULL DEFAULT ('PENDING'),
    [paymentStatus] NVARCHAR(50) NOT NULL DEFAULT ('PENDING'),
    [addressId] NVARCHAR(450) NOT NULL,
    [paymentRef] NVARCHAR(MAX),
    [stripeSessionId] NVARCHAR(MAX),
    [notes] NVARCHAR(MAX),
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [orders_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [orders_status_check] CHECK ([status] IN ('PENDING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REJECTED')),
    CONSTRAINT [orders_payment_check] CHECK ([paymentStatus] IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED'))
);

CREATE TABLE [order_items] (
    [id] NVARCHAR(450) NOT NULL,
    [orderId] NVARCHAR(450) NOT NULL,
    [productId] NVARCHAR(450) NOT NULL,
    [quantity] INT NOT NULL,
    [price] DECIMAL(10,2) NOT NULL,
    CONSTRAINT [order_items_pkey] PRIMARY KEY ([id])
);

CREATE TABLE [reviews] (
    [id] NVARCHAR(450) NOT NULL,
    [userId] NVARCHAR(450) NOT NULL,
    [productId] NVARCHAR(450) NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(MAX),
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [reviews_pkey] PRIMARY KEY ([id])
);

CREATE TABLE [addresses] (
    [id] NVARCHAR(450) NOT NULL,
    [userId] NVARCHAR(450) NOT NULL,
    [fullName] NVARCHAR(MAX) NOT NULL,
    [phone] NVARCHAR(MAX) NOT NULL,
    [street] NVARCHAR(MAX) NOT NULL,
    [city] NVARCHAR(MAX) NOT NULL,
    [state] NVARCHAR(MAX) NOT NULL,
    [zip] NVARCHAR(MAX) NOT NULL,
    [country] NVARCHAR(MAX) NOT NULL DEFAULT ('CA'),
    [isDefault] BIT NOT NULL DEFAULT 0,
    CONSTRAINT [addresses_pkey] PRIMARY KEY ([id])
);

CREATE TABLE [blog_posts] (
    [id] NVARCHAR(450) NOT NULL,
    [title] NVARCHAR(MAX) NOT NULL,
    [slug] NVARCHAR(450) NOT NULL,
    [content] NVARCHAR(MAX) NOT NULL,
    [excerpt] NVARCHAR(MAX),
    [image] NVARCHAR(MAX),
    [category] NVARCHAR(255) NOT NULL DEFAULT ('Agriculture'),
    [readTime] INT NOT NULL DEFAULT 3,
    [published] BIT NOT NULL DEFAULT 1,
    [views] INT NOT NULL DEFAULT 0,
    [authorId] NVARCHAR(450) NOT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [blog_posts_pkey] PRIMARY KEY ([id])
);

CREATE TABLE [articles] (
    [id] NVARCHAR(450) NOT NULL,
    [title] NVARCHAR(MAX) NOT NULL,
    [author] NVARCHAR(450) NOT NULL,
    [summary] NVARCHAR(MAX),
    [content] NVARCHAR(MAX) NOT NULL,
    [note] NVARCHAR(MAX),
    [pdfUrl] NVARCHAR(MAX),
    [pdfFileName] NVARCHAR(MAX),
    [pdfFileSize] INT,
    [status] NVARCHAR(50) NOT NULL DEFAULT ('PUBLISHED'),
    [views] INT NOT NULL DEFAULT 0,
    [downloads] INT NOT NULL DEFAULT 0,
    [tags] NVARCHAR(MAX),
    [createdBy] NVARCHAR(450),
    [publishedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [articles_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [articles_status_check] CHECK ([status] IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

CREATE TABLE [settings] (
    [id] NVARCHAR(450) NOT NULL,
    [siteName] NVARCHAR(MAX) NOT NULL DEFAULT ('Genesis Agri Business'),
    [siteDescription] NVARCHAR(MAX) DEFAULT ('Agriculture marketplace connecting farmers and buyers'),
    [adminEmail] NVARCHAR(MAX) NOT NULL DEFAULT ('admin@genesisagri.com'),
    [adminPhone] NVARCHAR(MAX) DEFAULT ('+1 (555) 123-4567'),
    [address] NVARCHAR(MAX) DEFAULT ('123 Farm Road, Nairobi, Kenya'),
    [timezone] NVARCHAR(MAX) NOT NULL DEFAULT ('Africa/Nairobi'),
    [dateFormat] NVARCHAR(MAX) NOT NULL DEFAULT ('MM/DD/YYYY'),
    [storeName] NVARCHAR(MAX) NOT NULL DEFAULT ('Genesis Agri Business'),
    [storeEmail] NVARCHAR(MAX) NOT NULL DEFAULT ('info@genesisagri.com'),
    [storePhone] NVARCHAR(MAX) DEFAULT ('+1 (555) 123-4567'),
    [storeAddress] NVARCHAR(MAX) DEFAULT ('123 Farm Road, Nairobi, Kenya'),
    [currency] NVARCHAR(50) NOT NULL DEFAULT ('KES'),
    [taxRate] FLOAT NOT NULL DEFAULT 16,
    [logo] NVARCHAR(MAX) DEFAULT '',
    [favicon] NVARCHAR(MAX) DEFAULT '',
    [twoFactorAuth] BIT NOT NULL DEFAULT 0,
    [sessionTimeout] INT NOT NULL DEFAULT 60,
    [emailNotifications] BIT NOT NULL DEFAULT 1,
    [orderNotifications] BIT NOT NULL DEFAULT 1,
    [productNotifications] BIT NOT NULL DEFAULT 1,
    [userNotifications] BIT NOT NULL DEFAULT 1,
    [marketingEmails] BIT NOT NULL DEFAULT 0,
    [themeColor] NVARCHAR(50) NOT NULL DEFAULT ('#22c55e'),
    [darkMode] BIT NOT NULL DEFAULT 0,
    [contactEmail] NVARCHAR(MAX) DEFAULT ('support@genesisagri.com'),
    [contactPhone] NVARCHAR(MAX) DEFAULT ('+1 (555) 123-4567'),
    [contactAddress] NVARCHAR(MAX) DEFAULT ('123 Agriculture Way, Farming District, FC 12345'),
    [contactHours] NVARCHAR(MAX) DEFAULT ('Mon-Fri: 8:00 AM - 6:00 PM'),
    [contactMapEmbed] NVARCHAR(MAX) DEFAULT '',
    [enableContactForm] BIT NOT NULL DEFAULT 1,
    [enableWhatsApp] BIT NOT NULL DEFAULT 1,
    [whatsAppNumber] NVARCHAR(MAX) DEFAULT ('+254700000000'),
    [enableLiveChat] BIT NOT NULL DEFAULT 0,
    [emergencyPhone] NVARCHAR(MAX) DEFAULT ('+1 (555) 999-9999'),
    [supportEmail] NVARCHAR(MAX) DEFAULT ('support@genesisagri.com'),
    [infoEmail] NVARCHAR(MAX) DEFAULT ('info@genesisagri.com'),
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [settings_pkey] PRIMARY KEY ([id])
);

-- 2. Create Indexes
CREATE UNIQUE INDEX [users_email_key] ON [users]([email]);
CREATE UNIQUE INDEX [profiles_userId_key] ON [profiles]([userId]);
CREATE UNIQUE INDEX [admin_profiles_userId_key] ON [admin_profiles]([userId]);
CREATE UNIQUE INDEX [categories_name_key] ON [categories]([name]);
CREATE UNIQUE INDEX [categories_slug_key] ON [categories]([slug]);
CREATE UNIQUE INDEX [products_slug_key] ON [products]([slug]);
CREATE UNIQUE INDEX [products_sku_key] ON [products]([sku]);
CREATE INDEX [products_categoryId_idx] ON [products]([categoryId]);
CREATE INDEX [products_status_idx] ON [products]([status]);
CREATE INDEX [products_visibility_idx] ON [products]([visibility]);
CREATE INDEX [products_sku_idx] ON [products]([sku]);
CREATE UNIQUE INDEX [carts_userId_key] ON [carts]([userId]);
CREATE UNIQUE INDEX [cart_items_userId_productId_key] ON [cart_items]([userId], [productId]);
CREATE UNIQUE INDEX [reviews_userId_productId_key] ON [reviews]([userId], [productId]);
CREATE UNIQUE INDEX [blog_posts_slug_key] ON [blog_posts]([slug]);
CREATE INDEX [blog_posts_authorId_idx] ON [blog_posts]([authorId]);
CREATE INDEX [articles_status_createdAt_idx] ON [articles]([status], [createdAt]);
CREATE INDEX [articles_author_idx] ON [articles]([author]);
CREATE INDEX [articles_createdBy_idx] ON [articles]([createdBy]);

-- 3. Add Foreign Keys
ALTER TABLE [profiles] ADD CONSTRAINT [profiles_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [admin_profiles] ADD CONSTRAINT [admin_profiles_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [categories] ADD CONSTRAINT [categories_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [categories]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [categories] ADD CONSTRAINT [categories_createdBy_fkey] FOREIGN KEY ([createdBy]) REFERENCES [users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [categories] ADD CONSTRAINT [categories_approvedBy_fkey] FOREIGN KEY ([approvedBy]) REFERENCES [users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [products] ADD CONSTRAINT [products_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [categories]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE [products] ADD CONSTRAINT [products_subCategoryId_fkey] FOREIGN KEY ([subCategoryId]) REFERENCES [categories]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [cart_items] ADD CONSTRAINT [cart_items_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [cart_items] ADD CONSTRAINT [cart_items_cartId_fkey] FOREIGN KEY ([cartId]) REFERENCES [carts]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [cart_items] ADD CONSTRAINT [cart_items_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [products]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [orders] ADD CONSTRAINT [orders_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE [orders] ADD CONSTRAINT [orders_addressId_fkey] FOREIGN KEY ([addressId]) REFERENCES [addresses]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE [order_items] ADD CONSTRAINT [order_items_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [orders]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [order_items] ADD CONSTRAINT [order_items_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [products]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [reviews] ADD CONSTRAINT [reviews_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE [reviews] ADD CONSTRAINT [reviews_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [products]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [addresses] ADD CONSTRAINT [addresses_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [blog_posts] ADD CONSTRAINT [blog_posts_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [articles] ADD CONSTRAINT [articles_createdBy_fkey] FOREIGN KEY ([createdBy]) REFERENCES [users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;