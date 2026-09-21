/*
  Warnings:

  - A unique constraint covering the columns `[paymentMethod,paymentRef]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "orders_paymentRef_key";

-- CreateIndex
CREATE UNIQUE INDEX "orders_paymentMethod_paymentRef_key" ON "orders"("paymentMethod", "paymentRef");
