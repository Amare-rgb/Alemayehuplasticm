// data/products.ts

export type ProductCategory = "Vegetables" | "Fruits" | "Cereals" | "Dairy" | "Spices";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  unit: string;
  stock: number;
  featured?: boolean;
  badge?: string;
  images: string[];
};

export const products: Product[] = [
  {
    id: "tomato-001",
    slug: "fresh-tomatoes",
    name: "Fresh Red Tomatoes",
    category: "Vegetables",
    description:
      "Fresh, naturally ripened red tomatoes sourced directly from local farm harvest.",
    price: 85,
    discountPrice: 75,
    unit: "kg",
    stock: 120,
    featured: true,
    badge: "Best Seller",
    images: [
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "tomato-002",
    slug: "organic-tomatoes",
    name: "Organic Vine Tomatoes",
    category: "Vegetables",
    description:
      "Freshly harvested ripe organic vine tomatoes grown without synthetic pesticides.",
    price: 95,
    unit: "kg",
    stock: 80,
    featured: true,
    badge: "Organic",
    images: [
      "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1546470427-227c7369a64e?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "spinach-001",
    slug: "fresh-spinach",
    name: "Fresh Garden Spinach",
    category: "Vegetables",
    description:
      "Nutrient-dense dark green spinach leaves harvested daily from our organic beds.",
    price: 30,
    unit: "bundle",
    stock: 85,
    badge: "Farm Fresh",
    images: [
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "onion-001",
    slug: "red-onions",
    name: "Crisp Red Onions",
    category: "Vegetables",
    description:
      "Aromatic, firm red onions carefully dried and curated for long kitchen shelf life.",
    price: 70,
    unit: "kg",
    stock: 90,
    images: [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "avocado-001",
    slug: "fresh-avocados",
    name: "Hass Fresh Avocados",
    category: "Fruits",
    description:
      "Rich and creamy avocados picked at peak maturity from highland orchards.",
    price: 140,
    discountPrice: 125,
    unit: "kg",
    stock: 55,
    featured: true,
    badge: "Special Offer",
    images: [
      "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "apple-001",
    slug: "fresh-apples",
    name: "Crisp Orchard Apples",
    category: "Fruits",
    description:
      "Sweet, crunchy fresh apples handpicked directly from local fruit orchards.",
    price: 85,
    unit: "kg",
    stock: 60,
    featured: true,
    badge: "Seasonal",
    images: [
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "banana-001",
    slug: "fresh-bananas",
    name: "Sweet Farm Bananas",
    category: "Fruits",
    description:
      "Naturally ripened sweet bananas packed with energy and natural potassium.",
    price: 75,
    unit: "kg",
    stock: 150,
    images: [
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "maize-001",
    slug: "yellow-maize",
    name: "Premium Yellow Maize",
    category: "Cereals",
    description:
      "High-grade dried yellow corn/maize grains suitable for milling and feeding.",
    price: 95,
    unit: "kg",
    stock: 300,
    featured: true,
    badge: "Best Value",
    images: [
      "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1601593768799-76e28b9f7c7b?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "wheat-001",
    slug: "whole-wheat",
    name: "Clean Whole Wheat",
    category: "Cereals",
    description:
      "Nutritious whole wheat grains cleaned and packed straight from the fields.",
    price: 110,
    unit: "kg",
    stock: 180,
    images: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1532629789574-5f4dc4f9d4f7?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "teff-001",
    slug: "organic-teff",
    name: "Organic Teff Grains",
    category: "Cereals",
    description:
      "Pure, gluten-free staple white and brown teff harvested from Ethiopian highlands.",
    price: 130,
    unit: "kg",
    stock: 200,
    featured: true,
    badge: "Gluten Free",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "milk-001",
    slug: "tana-fresh-milk",
    name: "Tana Farm Fresh Milk",
    category: "Dairy",
    description:
      "Pure pasteurized whole cow milk straight from our sister enterprise Tana Farm.",
    price: 90,
    unit: "liter",
    stock: 60,
    badge: "Tana Farm",
    images: [
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=85",
    ],
  },
];
