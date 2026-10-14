// app/admin/products/[id]/edit/page.tsx
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios, { AxiosError } from "axios";
import {
  ArrowLeft,
  Save,
  X,
  Package,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  Info,
  Weight,
  FolderPlus,
  Clock,
  Calendar,
} from "lucide-react";

// ============================================================
// API base
// ============================================================
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";
const API_URL = RAW_API_BASE.replace(/\/+$/, "");

// ============================================================
// Image resolver — Cloudinary ONLY
// ============================================================
function resolveImage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  if (s.startsWith("data:")) return s;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("res.cloudinary.com/")) return `https://${s}`;

  return null;
}

// ============================================================
// Axios
// ============================================================
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/auth/signin";
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Types
// ============================================================
interface ProductFormData {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  sku: string;
  categoryId: string;
  subCategoryId: string;
  tags: string[];
  images: string[];
  weight: string;
  unitOfMeasurement: string;
  durationTime: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
}

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

// ============================================================
// Options
// ============================================================
const unitOptions = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "set", label: "Set" },
  { value: "pack", label: "Pack" },
  { value: "box", label: "Box" },
  { value: "bag", label: "Bag" },
  { value: "roll", label: "Roll" },
  { value: "sheet", label: "Sheet" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "ton", label: "Ton" },
  { value: "liter", label: "Liter (L)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "m", label: "Meter (m)" },
  { value: "cm", label: "Centimeter (cm)" },
  { value: "inch", label: "Inch" },
  { value: "unit", label: "Unit" },
];

const durationOptions = [
  { value: "30m", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "2h", label: "2 Hours" },
  { value: "4h", label: "4 Hours" },
  { value: "8h", label: "8 Hours" },
  { value: "12h", label: "12 Hours" },
  { value: "24h", label: "24 Hours" },
  { value: "2d", label: "2 Days" },
  { value: "3d", label: "3 Days" },
  { value: "5d", label: "5 Days" },
  { value: "7d", label: "7 Days" },
  { value: "10d", label: "10 Days" },
  { value: "14d", label: "14 Days" },
  { value: "21d", label: "21 Days" },
  { value: "30d", label: "30 Days" },
  { value: "60d", label: "60 Days" },
  { value: "90d", label: "90 Days" },
];

// ============================================================
// Notification
// ============================================================
interface NotificationProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
}) => {
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
      case "success":
        return <CheckCircle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
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
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// Auth helper
// ============================================================
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken")
  );
};

// ============================================================
// ProductImage — top-level, Cloudinary-only
// ============================================================
const ProductImage: React.FC<{
  src: string | null;
  alt: string;
  index?: number;
  priority?: boolean;
}> = ({ src, alt, index = 0, priority = false }) => {
  const [prevSrc, setPrevSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
  }

  if (!src || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={200}
      height={200}
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
      unoptimized
      priority={priority || index === 0}
    />
  );
};

// ============================================================
// Add Category Modal
// ============================================================
interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: (category: Category) => void;
  title: string;
  isSubCategory?: boolean;
  parentCategoryId?: string;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryAdded,
  title,
  isSubCategory = false,
  parentCategoryId = "",
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setSlug(value ? generateSlug(value) : "");
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/api/categories");
      let categoriesData = [];
      if (Array.isArray(response.data)) categoriesData = response.data;
      else if (response.data?.categories)
        categoriesData = response.data.categories;
      else if (response.data?.data) categoriesData = response.data.data;
      setCategories(categoriesData.filter((cat: Category) => !cat.parentId));
    } catch (err) {
      console.log("Categories fetch error:", err);
    }
  }, []);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (isSubCategory && !hasFetched.current) {
      hasFetched.current = true;
      void fetchCategories();
    }
  }, [isSubCategory, fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!name.trim()) {
        setError("Name is required");
        setLoading(false);
        return;
      }
      if (!slug.trim()) {
        setError("Slug is required");
        setLoading(false);
        return;
      }

      const payload: {
        name: string;
        slug: string;
        description?: string;
        parentId?: string;
      } = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
      };

      if (isSubCategory && parentCategoryId) {
        payload.parentId = parentCategoryId;
      }

      // No explicit Authorization header — interceptor handles it
      const response = await api.post("/api/categories", payload);

      if (response.data) {
        const newCategory = response.data.category || response.data;
        onCategoryAdded(newCategory);
        setName("");
        setDescription("");
        setSlug("");
        onClose();
      }
    } catch (err) {
      console.error("Error creating category:", err);
      if (axios.isAxiosError(err)) {
        const errorMsg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          `Failed to create ${isSubCategory ? "subcategory" : "category"}`;
        setError(errorMsg);
      } else {
        setError(
          `Failed to create ${isSubCategory ? "subcategory" : "category"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSubCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={parentCategoryId}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm cursor-not-allowed"
                >
                  <option value="">Select Parent Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Selected from the dropdown above
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                required
                placeholder={`Enter ${
                  isSubCategory ? "subcategory" : "category"
                } name`}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-")
                  )
                }
                required
                placeholder="auto-generated"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">
                URL-friendly version
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !slug.trim()}
              className="px-4 py-2 text-sm text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? "Creating..."
                : `Create ${isSubCategory ? "Subcategory" : "Category"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// SKU generator
// ============================================================
const generateSKU = () => {
  const prefix = "APM";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
};

// ============================================================
// Main component
// ============================================================
const EditProductPage: React.FC<EditProductPageProps> = ({ params }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [newSku, setNewSku] = useState<string>("");

  const [authLoading, setAuthLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    sku: "",
    categoryId: "",
    subCategoryId: "",
    tags: [],
    images: [],
    weight: "",
    unitOfMeasurement: "pcs",
    durationTime: "1h",
  });

  const [newTag, setNewTag] = useState("");
  const isMounted = useRef(true);

  const hasSetProductId = useRef(false);
  const hasFetchedCategories = useRef(false);
  const hasFetchedProduct = useRef(false);
  const skuSet = useRef(false);

  // ── Auth ────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      const userData =
        localStorage.getItem("user") || sessionStorage.getItem("user");

      if (!token) {
        router.replace("/auth/signin");
        setAuthLoading(false);
        return;
      }

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.role?.toUpperCase() !== "ADMIN") {
            router.replace("/");
            setAuthLoading(false);
            return;
          }
          setAuthed(true);
        } catch {
          router.replace("/auth/signin");
        }
      } else {
        router.replace("/auth/signin");
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, [router]);

  // SKU
  useEffect(() => {
    if (!skuSet.current) {
      setNewSku(generateSKU());
      skuSet.current = true;
    }
  }, []);

  const showNotification = (
    type: "success" | "error" | "info" | "warning",
    message: string
  ) => setNotification({ type, message });

  const clearNotification = () => setNotification(null);

  // ── Params ──────────────────────────────────────────────
  const unwrappedParams = React.use(params);

  useEffect(() => {
    if (unwrappedParams && unwrappedParams.id && !hasSetProductId.current) {
      hasSetProductId.current = true;
      setProductId(unwrappedParams.id);
    }
  }, [unwrappedParams]);

  // ── Fetch categories ────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/api/categories");
      let categoriesData = [];
      if (Array.isArray(response.data)) categoriesData = response.data;
      else if (response.data?.categories)
        categoriesData = response.data.categories;
      else if (response.data?.data) categoriesData = response.data.data;
      setCategories(categoriesData.filter((cat: Category) => !cat.parentId));
    } catch (err) {
      console.log("Categories fetch error:", err);
    }
  }, []);

  const fetchSubCategories = useCallback(async (parentId: string) => {
    if (!parentId) {
      setSubCategories([]);
      return;
    }

    try {
      const response = await api.get(`/api/categories?parentId=${parentId}`);
      let subCategoriesData = [];
      if (Array.isArray(response.data)) subCategoriesData = response.data;
      else if (response.data?.categories)
        subCategoriesData = response.data.categories;
      else if (response.data?.data) subCategoriesData = response.data.data;
      setSubCategories(subCategoriesData);
    } catch {
      try {
        const response = await api.get("/api/categories");
        let allData = [];
        if (Array.isArray(response.data)) allData = response.data;
        else if (response.data?.categories)
          allData = response.data.categories;
        else if (response.data?.data) allData = response.data.data;
        setSubCategories(
          allData.filter((cat: Category) => cat.parentId === parentId)
        );
      } catch (err2) {
        console.log("Subcategories fetch error:", err2);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasFetchedCategories.current && authed) {
      hasFetchedCategories.current = true;
      void fetchCategories();
    }
  }, [fetchCategories, authed]);

  // ── Fetch product ───────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!productId || hasFetchedProduct.current || !authed) return;

      try {
        setLoading(true);
        setError(null);

        const token = getToken();
        if (!token) {
          showNotification(
            "error",
            "Authentication required. Please login again."
          );
          router.push("/auth/signin");
          return;
        }

        const response = await api.get(`/api/products/${productId}`);

        if (!isMounted.current) return;

        let product = response.data;
        if (response.data?.product) product = response.data.product;
        else if (response.data?.data) product = response.data.data;

        if (product) {
          hasFetchedProduct.current = true;
          const categoryId = product.categoryId || product.category?.id || "";
          const subCategoryId =
            product.subCategoryId || product.subCategory?.id || "";

          setFormData({
            name: product.name || "",
            description: product.description || "",
            price: product.price?.toString() || "",
            discountPrice: product.discountPrice?.toString() || "",
            sku: product.sku || "",
            categoryId,
            subCategoryId,
            tags: product.tags || [],
            images: product.images || [],
            weight: product.weight?.toString() || "",
            unitOfMeasurement: product.unitOfMeasurement || "pcs",
            durationTime: product.durationTime || "1h",
          });

          if (product.sku) setNewSku(product.sku);

          if (categoryId) {
            void fetchSubCategories(categoryId);
          }
        } else {
          showNotification("error", "Product not found");
          setError("Product not found");
        }
      } catch (err: unknown) {
        console.error("❌ Fetch error:", err);
        if (!isMounted.current) return;

        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ error: string }>;
          if (axiosError.response?.status === 404) {
            showNotification(
              "error",
              "Product not found. Please check the product ID."
            );
            setError("Product not found");
          } else if (
            axiosError.response?.status === 401 ||
            axiosError.response?.status === 403
          ) {
            showNotification(
              "error",
              "Authentication failed. Please login again."
            );
            router.push("/auth/signin");
          } else {
            const msg =
              axiosError.response?.data?.error ||
              `Failed to load product (Status: ${axiosError.response?.status})`;
            showNotification("error", msg);
            setError(msg);
          }
        } else {
          const msg =
            err instanceof Error ? err.message : "An unexpected error occurred";
          showNotification("error", msg);
          setError(msg);
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchData();
  }, [productId, router, authed, fetchSubCategories]);

  // ── Image upload → Cloudinary via /api/upload/product ───
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowed.includes(file.type)) {
      showNotification(
        "error",
        "Only JPG, PNG, WEBP, or GIF images are allowed."
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification("error", "Image size must be less than 10MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      // ✅ Product-specific Cloudinary upload endpoint
      const response = await api.post("/api/upload/product", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      let imageUrl: string | null = null;
      if (response.data?.url) imageUrl = response.data.url;
      else if (response.data?.secure_url) imageUrl = response.data.secure_url;

      if (imageUrl) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, imageUrl!],
        }));
        showNotification("success", "Image uploaded successfully");
      } else {
        showNotification("error", "Failed to get image URL from server");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      if (axios.isAxiosError(err)) {
        const errorMsg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to upload image";
        showNotification("error", errorMsg);
      } else {
        showNotification("error", "Failed to upload image");
      }
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "categoryId") {
      setFormData((prev) => ({
        ...prev,
        categoryId: value,
        subCategoryId: "",
      }));
      void fetchSubCategories(value);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      showNotification("success", `Tag "${newTag.trim()}" added`);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
    showNotification("info", `Tag "${tag}" removed`);
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    showNotification("info", "Image removed");
  };

  const handleCategoryAdded = (newCategory: Category) => {
    if (newCategory.parentId) {
      setSubCategories((prev) => [...prev, newCategory]);
      setFormData((prev) => ({
        ...prev,
        subCategoryId: newCategory.id,
      }));
      showNotification(
        "success",
        `Subcategory "${newCategory.name}" created and selected`
      );
    } else {
      setCategories((prev) => [...prev, newCategory]);
      setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
      showNotification(
        "success",
        `Category "${newCategory.name}" created and selected`
      );
    }
  };

  const handleGenerateSKU = () => {
    const newGeneratedSKU = generateSKU();
    setNewSku(newGeneratedSKU);
    setFormData((prev) => ({ ...prev, sku: newGeneratedSKU }));
    showNotification("info", `New SKU generated: ${newGeneratedSKU}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        showNotification(
          "error",
          "Authentication required. Please login again."
        );
        router.push("/auth/signin");
        return;
      }

      const submitData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        discountPrice: formData.discountPrice
          ? parseFloat(formData.discountPrice)
          : null,
        sku: formData.sku || newSku,
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId || undefined,
        tags: formData.tags,
        images: formData.images,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        unitOfMeasurement: formData.unitOfMeasurement || "pcs",
        durationTime: formData.durationTime || "1h",
      };

      const response = await api.put(`/api/products/${productId}`, submitData);

      if (response.data.success) {
        showNotification("success", "Product updated successfully! 🎉");
        setTimeout(() => router.push("/admin/products"), 1500);
      } else {
        showNotification(
          "error",
          response.data.error || "Failed to update product"
        );
      }
    } catch (err: unknown) {
      console.error("Error updating product:", err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        if (axiosError.response?.status === 401) {
          showNotification(
            "error",
            "Authentication failed. Please login again."
          );
          router.push("/auth/signin");
        } else {
          showNotification(
            "error",
            axiosError.response?.data?.error ||
              `Failed to update product (Status: ${axiosError.response?.status})`
          );
        }
      } else {
        showNotification(
          "error",
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  // ── Render ──────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authed) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
          <div className="flex justify-center space-x-3">
            <Link
              href="/admin/products"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Products
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Retry
            </button>
          </div>
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

      <AddCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryAdded={handleCategoryAdded}
        title="Add New Category"
        isSubCategory={false}
      />

      <AddCategoryModal
        isOpen={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        onCategoryAdded={handleCategoryAdded}
        title="Add New Subcategory"
        isSubCategory={true}
        parentCategoryId={formData.categoryId}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/products"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Edit Product
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Update product details and inventory
            </p>
          </div>
        </div>
        <Link
          href="/admin/products"
          className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-6">
                <Package className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">
                  Product Information
                </h3>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Heavy-Duty Storage Bin"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    required
                    placeholder="Describe your plastic product in detail..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        required
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="px-3 py-2.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap flex items-center space-x-1"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>New</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sub Category
                    </label>
                    <div className="flex space-x-2">
                      <select
                        name="subCategoryId"
                        value={formData.subCategoryId}
                        onChange={handleChange}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                        disabled={!formData.categoryId}
                      >
                        <option value="">Select Sub Category</option>
                        {subCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.categoryId) {
                            showNotification(
                              "warning",
                              "Please select a category first"
                            );
                            return;
                          }
                          setShowSubCategoryModal(true);
                        }}
                        className="px-3 py-2.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap flex items-center space-x-1"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>New</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    SKU
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku || newSku}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSKU}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Listing Duration</span>
                    </div>
                  </label>
                  <select
                    name="durationTime"
                    value={formData.durationTime || "1h"}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                  >
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Weight & Unit{" "}
                    <span className="text-xs text-gray-400">
                      (e.g., 1 kg of plastic resin)
                    </span>
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        <Weight className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <select
                      name="unitOfMeasurement"
                      value={formData.unitOfMeasurement}
                      onChange={handleChange}
                      className="w-48 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                    >
                      {unitOptions.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Price (ETB) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        ETB
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        step="0.01"
                        required
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Discount Price (ETB)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        ETB
                      </span>
                      <input
                        type="number"
                        name="discountPrice"
                        value={formData.discountPrice}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Optional"
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-sm rounded-full border border-yellow-200"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {formData.tags.length === 0 && (
                      <span className="text-sm text-gray-400">
                        No tags added
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-sm whitespace-nowrap"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-4 h-4 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Images
                </h3>
                <span className="text-xs text-gray-400 ml-auto">
                  {formData.images.length} uploaded
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {formData.images.map((img, index) => {
                  const imageUrl = resolveImage(img);
                  return (
                    <div
                      key={index}
                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
                    >
                      <ProductImage
                        src={imageUrl}
                        alt={`Product ${index + 1}`}
                        index={index}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-yellow-500 transition-colors cursor-pointer group"
                >
                  <div className="text-center">
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto group-hover:text-yellow-500 transition-colors" />
                        <span className="text-xs text-gray-500 group-hover:text-yellow-500 transition-colors">
                          Upload
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
                multiple={false}
              />
              {formData.images.length === 0 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Click to upload images (max 10MB)
                </p>
              )}
            </div>

            {/* Duration Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Duration Info
                </h3>
              </div>
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-purple-700">
                      Product stays active for the selected duration.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">
                    {durationOptions.find(
                      (d) => d.value === formData.durationTime
                    )?.label || "Not set"}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <Info className="w-4 h-4 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Product Summary
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Product ID:</span>
                  <span className="font-medium text-gray-700">
                    #{productId || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium text-gray-700 truncate max-w-[140px]">
                    {formData.name || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-medium text-gray-700">
                    {formData.price
                      ? formatCurrency(parseFloat(formData.price))
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Discount:</span>
                  <span className="font-medium text-gray-700">
                    {formData.discountPrice
                      ? formatCurrency(parseFloat(formData.discountPrice))
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium text-gray-700 truncate max-w-[140px]">
                    {categories.find((c) => c.id === formData.categoryId)
                      ?.name || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Subcategory:</span>
                  <span className="font-medium text-gray-700 truncate max-w-[140px]">
                    {subCategories.find(
                      (c) => c.id === formData.subCategoryId
                    )?.name || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Weight:</span>
                  <span className="font-medium text-gray-700">
                    {formData.weight
                      ? `${formData.weight} ${formData.unitOfMeasurement}`
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Images:</span>
                  <span className="font-medium text-gray-700">
                    {formData.images.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage;