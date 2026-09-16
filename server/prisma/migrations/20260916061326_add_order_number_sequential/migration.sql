/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE [orders] ADD [orderNumber] INT IDENTITY(1,1) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX [orders_orderNumber_key] ON [orders]([orderNumber]);