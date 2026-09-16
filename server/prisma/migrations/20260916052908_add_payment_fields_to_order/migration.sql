-- AlterTable
ALTER TABLE [orders] ADD 
    [paymentMethod] NVARCHAR(MAX),
    [paymentProof] NVARCHAR(MAX);

-- CreateIndex
CREATE INDEX [orders_userId_idx] ON [orders]([userId]);

-- CreateIndex
CREATE INDEX [orders_status_idx] ON [orders]([status]);

-- CreateIndex
CREATE INDEX [orders_paymentStatus_idx] ON [orders]([paymentStatus]);