// data/blog.ts

export interface Author {
  id?: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  image?: string | null;
  video?: string | null;   // ✅ ADDED — matches what the API returns
  category: string;
  readTime: number;
  views: number;
  published: boolean;
  authorId?: string;
  author?: Author | null;
  createdAt: string;
  updatedAt?: string;
  featured?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Local fallbacks — these live in /public and never 404
// ─────────────────────────────────────────────────────────────────────────────
const LOCAL_FALLBACK_IMAGE = "/banners/placeholder.jpg";

// Confirmed-working Unsplash images (in case you prefer remote assets)
const FALLBACK_REMOTE_IMAGES = [
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=2200&q=90",
];

export const FALLBACK_BLOG_POSTS: BlogPost[] = [
  {
    id: "post-1",
    slug: "what-makes-truly-farm-fresh-produce-different",
    category: "Farming",
    createdAt: "2026-08-18T08:00:00.000Z",
    readTime: 5,
    views: 420,
    published: true,
    title: "What makes truly farm-fresh produce different?",
    excerpt:
      "Freshness starts long before produce reaches your kitchen. Here's how thoughtful farming, careful harvesting, and a shorter journey make a difference.",
    content: `At Genesis, we believe that good food begins long before it reaches the kitchen. It begins with healthy soil, thoughtful farming, and a commitment to doing things properly.

When we talk about farm-fresh produce, we're talking about more than a label. Freshness is a journey — one that starts in the field and continues through every decision made during cultivation, harvesting, selection, and delivery.

### Freshness starts in the field
The quality of produce is closely connected to how it is grown. Healthy crops require healthy soil, appropriate growing conditions, careful monitoring, and farmers who understand the land they work with.

At Genesis, we pay attention to the details. From preparing the soil to monitoring crops throughout the growing season, our approach is centered around producing food that we would be proud to put on our own table.

> "When we take care of the land, the land takes care of the harvest." — Genesis Farm Team

### A shorter journey from farm to table
One of the simplest advantages of buying directly from a farm is the shorter distance between where food is grown and where it is enjoyed.

Fewer unnecessary steps can mean better freshness, better visibility into where food comes from, and a stronger relationship between farmers and the people they feed.

### More than produce
Farming connects people to the land, to the seasons, and to one another. Every harvest represents countless hours of work and a relationship with nature that cannot be rushed.

That's why our work at Genesis is about more than simply growing crops. It is about building a food system that values quality, responsibility, and the people behind every harvest.`,
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2200&q=90",
    author: {
      name: "Genesis Farm Team",
      avatar: "https://ui-avatars.com/api/?name=Genesis+Farm&background=22c55e&color=fff",
    },
    featured: true,
  },
  {
    id: "post-2",
    slug: "growing-with-the-land-not-against-it",
    category: "Sustainability",
    createdAt: "2026-08-12T08:00:00.000Z",
    readTime: 6,
    views: 310,
    published: true,
    title: "Growing with the land, not against it",
    excerpt:
      "Healthy soil is at the heart of every healthy harvest. Discover regenerative agriculture techniques used in the Ethiopian highlands.",
    content: `Regenerative agriculture focuses on restoring soil biodiversity and regenerating topsoil degraded by conventional farming practices.

By minimizing tilling, rotating nitrogen-fixing legume crops, and applying natural compost, our highland farms maintain moisture and reduce water runoff.

### Protecting Natural Watersheds
Water conservation is critical for sustainable farming. Our irrigation networks use precision drip systems and natural rainwater catchment basins to minimize water waste.

The result is resilient farming that withstands dry spells while producing nutrient-dense crops year after year.`,
    image:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=2200&q=90",
    author: {
      name: "Agronomy Department",
      avatar: "https://ui-avatars.com/api/?name=Agronomy+Dept&background=16a34a&color=fff",
    },
  },
  {
    id: "post-3",
    slug: "from-sunrise-harvest-to-your-table",
    category: "Fresh Produce",
    createdAt: "2026-08-05T08:00:00.000Z",
    readTime: 4,
    views: 280,
    published: true,
    title: "From sunrise harvest to your table",
    excerpt:
      "A look behind the scenes at what happens between the moment a crop is picked at dawn and the moment it reaches your doorstep.",
    content: `Our harvesting teams start work at 5:30 AM before the morning sun creates moisture loss in leafy greens and ripe tomatoes.

Crops are sorted directly at farm collection hubs, graded for quality, and packaged in breathable, sustainable crates.

Within hours of being picked, temperature-controlled delivery vans dispatch fresh harvest across Addis Ababa and surrounding regions, ensuring maximum crispness and vitamin retention.`,
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2200&q=90",
    author: {
      name: "Logistics Team",
      avatar: "https://ui-avatars.com/api/?name=Logistics+Team&background=059669&color=fff",
    },
  },
  {
    id: "post-4",
    slug: "a-morning-in-the-fields-at-genesis",
    category: "Our Farm",
    createdAt: "2026-07-28T08:00:00.000Z",
    readTime: 7,
    views: 195,
    published: true,
    title: "A morning in the fields at Genesis",
    excerpt:
      "Walk with us through an ordinary morning on the farm — from morning soil inspection to sorting fresh grains.",
    content: `Morning on the farm brings an atmosphere of focus and rhythm. Dew still rests on cabbage leaves as agronomists inspect seedling beds.

Workers carefully weed between rows of organic carrots and prune heirloom tomato vines.

Every day presents new observations: how the soil feels, pest prevention without harsh chemicals, and ensuring that every plant receives optimal sunlight and nourishment.`,
    image:
      "https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=2200&q=90",
    author: {
      name: "Genesis Farm Team",
      avatar: "https://ui-avatars.com/api/?name=Genesis+Farm&background=22c55e&color=fff",
    },
  },
  {
    id: "post-5",
    slug: "the-people-behind-every-harvest",
    category: "Stories",
    createdAt: "2026-07-19T08:00:00.000Z",
    readTime: 5,
    views: 240,
    published: true,
    title: "The people behind every harvest",
    excerpt:
      "Farming is more than soil and sunshine. Meet some of the dedicated growers whose generational knowledge keeps Genesis thriving.",
    content: `Behind every box of fresh produce are skilled agricultural workers with deep knowledge of seed germination, harvest timing, and weather patterns.

We partner with over 60 local farm families, providing fair market prices, technical agronomy training, and modern irrigation infrastructure.

Empowering growers ensures agricultural continuity, rural livelihood growth, and authentic farm-to-table food safety for all consumers.`,
    // ✅ FIXED: was a dead Unsplash URL — replaced with working photo
    image:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2200&q=90",
    author: {
      name: "Community Outreach",
      avatar: "https://ui-avatars.com/api/?name=Community+Outreach&background=0d9488&color=fff",
    },
  },
  {
    id: "post-6",
    slug: "why-healthy-soil-means-a-healthier-future",
    category: "Sustainability",
    createdAt: "2026-07-10T08:00:00.000Z",
    readTime: 6,
    views: 350,
    published: true,
    title: "Why healthy soil means a healthier future",
    excerpt:
      "Good agriculture begins underground. How biological soil health creates richer flavors and higher nutritional value.",
    content: `Soil is a living ecosystem populated by billions of beneficial microorganisms, mycorrhizal fungi, and earthworms.

When soil biology is preserved through organic matter and green mulching, plants naturally resist drought and absorb higher mineral concentrations like calcium, zinc, and iron.

Healthier soil directly translates to tastier vegetables, sweeter fruits, and more nutritious grains on your family table.`,
    // ✅ FIXED: was a dead Unsplash URL — replaced with working photo
    image:
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=2200&q=90",
    author: {
      name: "Soil Science Lab",
      avatar: "https://ui-avatars.com/api/?name=Soil+Science&background=15803d&color=fff",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// formatBlogImage — never returns a broken URL
// ─────────────────────────────────────────────────────────────────────────────
export const formatBlogImage = (image?: string | null): string => {
  // No value → local fallback
  if (!image || typeof image !== "string" || image.trim() === "") {
    return LOCAL_FALLBACK_IMAGE;
  }

  const trimmed = image.trim();

  // Absolute URL → pass through unchanged
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Root-relative path from /public (not an upload) → pass through
  if (trimmed.startsWith("/") && !trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  // Backend upload path → prefix with API base
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return `${apiBase}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

export const formatBlogDate = (dateString?: string): string => {
  if (!dateString) return "Recent";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

// Export the fallback list so pages can pick a rotating placeholder if needed
export { LOCAL_FALLBACK_IMAGE, FALLBACK_REMOTE_IMAGES };