export type ProductCategory = "Vegetables" | "Fruits" | "Cereals";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
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
    name: "Fresh Tomatoes",
    category: "Vegetables",
    description:
      "Fresh, naturally ripened tomatoes sourced directly from local farms.",
    price: 85,
    unit: "kg",
    stock: 120,
    featured: true,
    badge: "Best Seller",
    images: [
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "tomato-002",
    slug: "organic-tomatoes",
    name: "Organic Tomatoes",
    category: "Vegetables",
    description:
      "Freshly harvested ripe organic tomatoes directly from Genesis fields.",
    price: 45,
    unit: "kg",
    stock: 120,
    featured: true,
    badge: "Farm Fresh",
    images: [
      "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1546470427-227c7369a64e?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "spinach-001",
    slug: "fresh-spinach",
    name: "Fresh Spinach & Garden Greens",
    category: "Vegetables",
    description:
      "Nutrient-rich green spinach leaves harvested daily from our organic garden beds.",
    price: 30,
    unit: "bundle",
    stock: 85,
    badge: "Organic",
    images: [
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "onion-001",
    slug: "red-onions",
    name: "Red Onions",
    category: "Vegetables",
    description:
      "Crisp, flavorful red onions carefully selected for freshness and quality.",
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
    name: "Fresh Avocados",
    category: "Fruits",
    description:
      "Creamy, nutrient-rich avocados harvested at the right stage of ripeness.",
    price: 140,
    unit: "kg",
    stock: 55,
    featured: true,
    badge: "Farm Fresh",
    images: [
      "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "apple-001",
    slug: "fresh-apples",
    name: "Seasonal Fresh Apples",
    category: "Fruits",
    description:
      "Sweet, crisp handpicked apples direct from orchard harvest.",
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
    name: "Fresh Bananas",
    category: "Fruits",
    description:
      "Naturally sweet bananas sourced directly from trusted local growers.",
    price: 75,
    unit: "kg",
    stock: 150,
    images: [
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "banana-002",
    slug: "ripe-bananas",
    name: "Ripe Bananas (Cluster)",
    category: "Fruits",
    description:
      "Naturally ripened sweet bananas packed with energy and essential nutrients.",
    price: 65,
    unit: "cluster",
    stock: 140,
    images: [
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "maize-001",
    slug: "yellow-maize",
    name: "Yellow Maize",
    category: "Cereals",
    description:
      "High-quality maize sourced directly from farmers and carefully handled.",
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
    name: "Whole Wheat",
    category: "Cereals",
    description:
      "Wholesome whole wheat grains selected for quality and nutrition.",
    price: 110,
    unit: "kg",
    stock: 180,
    images: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1532629789574-5f4dc4f9d4f7?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "wheat-002",
    slug: "premium-wheat",
    name: "Premium Wheat Grains",
    category: "Cereals",
    description:
      "High-quality whole wheat grains for home milling, bread, and porridge.",
    price: 320,
    unit: "5kg pack",
    stock: 40,
    badge: "Premium",
    images: [
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "teff-001",
    slug: "organic-teff",
    name: "Organic Teff Grain",
    category: "Cereals",
    description:
      "Pure gluten-free staple teff grain directly from farm harvest.",
    price: 680,
    unit: "10kg bag",
    stock: 30,
    badge: "Gluten Free",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "milk-001",
    slug: "tana-fresh-milk",
    name: "Tana Farm Fresh Cow Milk",
    category: "Cereals",
    description:
      "100% pure, farm-fresh pasteurized cow milk from Tana Sister Farm.",
    price: 110,
    unit: "2L bottle",
    stock: 50,
    badge: "Tana Farm",
    images: [
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    id: "cow-001",
    slug: "tana-cattle",
    name: "Tana Farm Raised Cattle / Cow",
    category: "Cereals",
    description:
      "Healthy, well-cared farm-raised cow for livestock purchase from Tana Sister Farm.",
    price: 45000,
    unit: "animal",
    stock: 5,
    badge: "Tana Farm",
    images: [
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=85",
    ],
  },
];
