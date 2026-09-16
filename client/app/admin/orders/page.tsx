// app/admin/orders/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ordersApi } from '@/lib/api';
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Info,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Banknote,
  Wallet,
  Building,
  ThumbsUp,
  Smartphone,
  FileText,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================================
// Image URL normalizer
// ============================================================
function normalizeImageUrl(src?: string | null): string {
  if (!src) return '/placeholder-image.png';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('data:')) return src;
  return src.startsWith('/') ? src : `/${src}`;
}

// ============================================================
// Base64 data URL → Blob URL
// ============================================================
function dataUrlToBlobUrl(dataUrl: string): string | null {
  try {
    const comma = dataUrl.indexOf(',');
    if (comma === -1) return null;

    const header = dataUrl.slice(0, comma);
    const base64 = dataUrl.slice(comma + 1);
    if (!base64) return null;

    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to convert data URL to Blob URL:', err);
    return null;
  }
}

// Types
interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface Product {
  id: string;
  name: string;
  images: string[];
  slug: string;
  price: number;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Order {
  id: string;
  orderNumber: number;
  userId: string;
  addressId: string;
  total: number;
  status: 'PENDING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  paymentRef?: string;
  paymentProof?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  address: Address;
  items: OrderItem[];
}

// Notification Component
interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-md ${getColors()}`}
      >
        {getIcon()}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// Shared helpers
// ============================================================
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    SHIPPED: 'bg-purple-100 text-purple-700 border-purple-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    REJECTED: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getPaymentStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PAID: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    SHIPPED: 'Shipped',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected',
  };
  return labels[status] || status;
};

const getPaymentMethodLabel = (method?: string) => {
  if (!method) return 'Not specified';
  const lower = method.toLowerCase();
  if (lower.includes('telebirr')) return 'Telebirr Mobile Money';
  if (lower.includes('bank')) return 'Commercial Bank Transfer';
  if (lower.includes('cash')) return 'Cash on Delivery';
  return method;
};

const getPaymentMethodIcon = (method?: string) => {
  if (!method) return <CreditCard className="w-4 h-4" />;
  const lower = method.toLowerCase();
  if (lower.includes('telebirr')) return <Smartphone className="w-4 h-4" />;
  if (lower.includes('bank')) return <Building className="w-4 h-4" />;
  if (lower.includes('cash')) return <Banknote className="w-4 h-4" />;
  if (lower.includes('card')) return <CreditCard className="w-4 h-4" />;
  if (lower.includes('paypal') || lower.includes('wallet'))
    return <Wallet className="w-4 h-4" />;
  return <CreditCard className="w-4 h-4" />;
};

const getProofType = (proof?: string): 'image' | 'pdf' | 'unknown' => {
  if (!proof) return 'unknown';
  if (proof.startsWith('data:image/')) return 'image';
  if (proof.startsWith('data:application/pdf')) return 'pdf';
  return 'unknown';
};

// ============================================================
// Order Detail Modal
// ============================================================
interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
}) => {
  const [approving, setApproving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const showNotification = (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string
  ) => {
    setNotification({ type, message });
    if (type === 'info') toast(message, { icon: 'ℹ️' });
    else if (type === 'warning') toast.error(message, { icon: '⚠️' });
    else if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
  };

  const clearNotification = () => setNotification(null);

  const handleDownloadProof = (proof: string, orderNumber: number) => {
    try {
      const isPdf = proof.startsWith('data:application/pdf');
      const ext = isPdf ? 'pdf' : 'png';
      const fileName = `payment-proof-${orderNumber}.${ext}`;

      if (proof.startsWith('http://') || proof.startsWith('https://')) {
        const a = document.createElement('a');
        a.href = proof;
        a.download = fileName;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      const blobUrl = dataUrlToBlobUrl(proof);
      if (!blobUrl) {
        showNotification('error', 'Failed to prepare the file for download');
        return;
      }

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error('Download failed:', err);
      showNotification('error', 'Failed to download proof');
    }
  };

  const handleOpenProof = (proof: string) => {
    try {
      if (proof.startsWith('http://') || proof.startsWith('https://')) {
        window.open(proof, '_blank', 'noopener,noreferrer');
        return;
      }

      const blobUrl = dataUrlToBlobUrl(proof);
      if (!blobUrl) {
        showNotification('error', 'Failed to open the file');
        return;
      }

      window.open(blobUrl, '_blank', 'noopener,noreferrer');

      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch (err) {
      console.error('Open failed:', err);
      showNotification('error', 'Failed to open the file');
    }
  };

  const handleApproveOrder = async () => {
    if (!order) return;

    if (order.status !== 'PENDING') {
      showNotification('warning', 'Only pending orders can be approved');
      return;
    }

    setApproving(true);
    try {
      // ✅ Send BOTH status AND paymentStatus so the two badges stay in sync.
      //    The backend also auto-sets paymentStatus to PAID for COMPLETED
      //    orders, but sending it explicitly makes the intent unambiguous.
      const response = await ordersApi.updateOrder({
        orderId: order.id,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      });

      if (response.success) {
        showNotification(
          'success',
          `Order #${order.orderNumber} approved successfully!`
        );
        onStatusUpdate();
        setTimeout(() => onClose(), 1500);
      } else {
        showNotification('error', response.message || 'Failed to approve order');
      }
    } catch (err) {
      console.error('Error approving order:', err);
      showNotification('error', 'Failed to approve order');
    } finally {
      setApproving(false);
    }
  };

  if (!isOpen || !order) return null;

  const canApprove = order.status === 'PENDING';
  const proofType = getProofType(order.paymentProof);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-md ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : notification.type === 'warning'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {notification.type === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {notification.type === 'error' && (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            {notification.type === 'warning' && (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            {notification.type === 'info' && (
              <Info className="w-5 h-5 text-blue-500" />
            )}
            <p className="text-sm font-medium flex-1">{notification.message}</p>
            <button
              onClick={clearNotification}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
            <p className="text-xs text-gray-500">Order #{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status banner */}
          <div
            className={`rounded-lg p-4 border ${
              canApprove
                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
                : order.status === 'COMPLETED'
                ? 'bg-green-50 border-green-200'
                : order.status === 'CANCELLED'
                ? 'bg-red-50 border-red-200'
                : order.status === 'REJECTED'
                ? 'bg-gray-50 border-gray-200'
                : order.status === 'SHIPPED'
                ? 'bg-purple-50 border-purple-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-3">
                {canApprove ? (
                  <Clock className="w-5 h-5 text-amber-600" />
                ) : order.status === 'COMPLETED' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : order.status === 'CANCELLED' ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : order.status === 'REJECTED' ? (
                  <XCircle className="w-5 h-5 text-gray-600" />
                ) : order.status === 'SHIPPED' ? (
                  <Truck className="w-5 h-5 text-purple-600" />
                ) : (
                  <Package className="w-5 h-5 text-blue-600" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {canApprove
                    ? 'Order Pending Review'
                    : order.status === 'COMPLETED'
                    ? 'Order Completed'
                    : order.status === 'CANCELLED'
                    ? 'Order Cancelled'
                    : order.status === 'REJECTED'
                    ? 'Order Rejected'
                    : order.status === 'SHIPPED'
                    ? 'Order Shipped'
                    : 'Order Status'}
                </span>
              </div>

              <div className="flex-1"></div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Status:</span>
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                    order.status
                  )}`}
                >
                  <span>{getStatusLabel(order.status)}</span>
                </span>
              </div>
            </div>

            {canApprove ? (
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-amber-200">
                <span className="text-xs text-gray-500 font-medium">
                  Take Action:
                </span>
                <button
                  onClick={handleApproveOrder}
                  disabled={approving}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                >
                  {approving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4" />
                      <span>Approve Order</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {order.status === 'COMPLETED' && 'This order is already completed.'}
                  {order.status === 'CANCELLED' && 'This order has been cancelled.'}
                  {order.status === 'REJECTED' && 'This order has been rejected.'}
                  {order.status === 'SHIPPED' && 'This order has already been shipped.'}
                </span>
              </div>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>Customer Information</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{order.user.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{order.user.email}</span>
                </div>
                {order.user.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{order.user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Shipping Address</span>
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.address.fullName}</p>
                <p className="text-gray-600">{order.address.street}</p>
                <p className="text-gray-600">
                  {order.address.city}, {order.address.state} {order.address.zip}
                </p>
                <p className="text-gray-600">{order.address.country}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{order.address.phone}</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span>Order Summary</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Total:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Items:</span>
                  <span className="text-gray-700">{order.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Date:</span>
                  <span className="text-gray-700">{formatDate(order.createdAt)}</span>
                </div>
                {order.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Notes:</span>
                    <span className="text-gray-700">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span>Payment Information</span>
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="flex items-center space-x-1.5 text-gray-800 font-medium">
                    {getPaymentMethodIcon(order.paymentMethod)}
                    <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(
                      order.paymentStatus
                    )}`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>

                {order.paymentRef && (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-gray-500 shrink-0">Reference #:</span>
                    <span className="text-gray-800 font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 break-all text-right">
                      {order.paymentRef}
                    </span>
                  </div>
                )}

                {order.paymentProof && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500">Payment Proof:</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadProof(order.paymentProof!, order.orderNumber)
                        }
                        className="flex items-center space-x-1 text-xs font-medium text-green-600 hover:text-green-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>

                    {proofType === 'image' && (
                      <button
                        type="button"
                        onClick={() => handleOpenProof(order.paymentProof!)}
                        className="block w-full rounded-lg border border-gray-200 overflow-hidden hover:border-green-400 transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.paymentProof}
                          alt="Payment proof"
                          className="w-full h-44 object-contain bg-gray-50"
                        />
                      </button>
                    )}

                    {proofType === 'pdf' && (
                      <button
                        type="button"
                        onClick={() => handleOpenProof(order.paymentProof!)}
                        className="flex w-full items-center space-x-2 rounded-lg border border-gray-200 p-3 hover:border-green-400 hover:bg-green-50 transition-colors text-left"
                      >
                        <FileText className="w-8 h-8 text-red-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800">
                            PDF Receipt
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Click to open in new tab
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {!order.paymentProof && !order.paymentRef && (
                  <p className="text-xs text-gray-400 italic pt-2 border-t border-gray-100">
                    No payment proof or reference was attached to this order.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order items table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                            {item.product.images && item.product.images.length > 0 ? (
                              <Image
                                src={normalizeImageUrl(item.product.images[0])}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.src = '/placeholder-image.png';
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              SKU: {item.productId.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-right text-sm font-medium text-gray-700"
                    >
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main OrdersPage component
// ============================================================
const OrdersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);

  const showNotification = (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string
  ) => {
    setNotification({ type, message });
    if (type === 'info') toast(message, { icon: 'ℹ️' });
    else if (type === 'warning') toast.error(message, { icon: '⚠️' });
    else if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
  };

  const clearNotification = () => setNotification(null);

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      COMPLETED: <CheckCircle className="w-3.5 h-3.5" />,
      PENDING: <Clock className="w-3.5 h-3.5" />,
      SHIPPED: <Truck className="w-3.5 h-3.5" />,
      CANCELLED: <XCircle className="w-3.5 h-3.5" />,
      REJECTED: <XCircle className="w-3.5 h-3.5" />,
    };
    return icons[status] || null;
  };

  const statuses = ['ALL', 'PENDING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const response = await ordersApi.getOrders({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        page: currentPage,
        limit: pageSize,
      });

      if (!isMounted.current) return;

      if (response && response.orders) {
        setOrders(response.orders);
        setTotal(response.total);
        setTotalPages(response.pages || Math.ceil(response.total / pageSize));
      } else {
        setOrders([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      if (!isMounted.current) return;
      showNotification('error', 'Failed to fetch orders');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [selectedStatus, currentPage, pageSize]);

  useEffect(() => {
    isMounted.current = true;
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchOrders();
    }
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedStatus('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    showNotification('info', 'Refreshing orders...');
    fetchOrders();
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      String(order.orderNumber).includes(q) ||
      order.user.name.toLowerCase().includes(q) ||
      order.user.email.toLowerCase().includes(q) ||
      (order.user.phone && order.user.phone.includes(searchQuery));
    return matchesSearch;
  });

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalFiltered = filteredOrders.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}

      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusUpdate={fetchOrders}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Orders</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage and track all customer orders
          </p>
          <p className="text-xs text-gray-400 mt-1">Total: {totalOrders} orders</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-lg font-bold text-yellow-600">{pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-lg font-bold text-green-600">{completedOrders}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by number, customer, email, or phone..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showFilters ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All Statuses' : getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {paginatedOrders.length > 0 ? (
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Order #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewOrder(order)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.user.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">
                            {order.user.email}
                          </span>
                        </div>
                        {order.user.phone && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{order.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span>{getStatusLabel(order.status)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                        {order.paymentMethod && (
                          <div className="text-xs text-gray-500">
                            {getPaymentMethodLabel(order.paymentMethod)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order);
                        }}
                        className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No orders found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>

        {totalFiltered > pageSize && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(totalFiltered / pageSize))
                  )
                }
                disabled={currentPage >= Math.ceil(totalFiltered / pageSize)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;