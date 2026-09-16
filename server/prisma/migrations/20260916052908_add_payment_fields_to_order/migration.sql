-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentProof" TEXT;

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");
