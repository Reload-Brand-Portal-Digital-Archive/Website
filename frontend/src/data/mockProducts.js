export const mockProducts = [
  // Embrace The Decay // 01 (collection_id: 1)
  {
    product_id: 101,
    collection_id: 1,
    name: "Decay Oversized Tee",
    slug: "decay-oversized-tee",
    description: "Heavyweight 24S cotton oversized t-shirt. Features cracked plastisol print on the back and subtle front branding. Pre-washed for a vintage feel.",
    category: "Baju",
    price: 199000,
    sizes: ["M", "L", "XL"],
    status: "available",
    sort_order: 1,
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?q=80&w=1000&auto=format&fit=crop"
    ]
  },
  {
    product_id: 102,
    collection_id: 1,
    name: "Brutalist Ribbed Tank",
    slug: "brutalist-ribbed-tank",
    description: "Premium ribbed singlet with a snug fit. Embroidered RELOAD logo centered on the chest. Perfect for layering.",
    category: "Singlet",
    price: 120000,
    sizes: ["S", "M", "L"],
    status: "available",
    sort_order: 2,
    images: ["https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=800&auto=format&fit=crop"]
  },
  {
    product_id: 103,
    collection_id: 1,
    name: "Concrete Snapback",
    slug: "concrete-snapback",
    description: "Structured 6-panel hiphop cap with 3D embroidery. Adjustable strap.",
    category: "Topi hiphop",
    price: 150000,
    sizes: ["All Size"],
    status: "sold_out",
    sort_order: 3,
    images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop"]
  },

  // Null Protocol (collection_id: 2)
  {
    product_id: 201,
    collection_id: 2,
    name: "Protocol Utility Boxer",
    slug: "protocol-utility-boxer",
    description: "Comfortable organic cotton boxers with a branded jacquard waistband.",
    category: "Boxer",
    price: 89000,
    sizes: ["M", "L", "XL"],
    status: "available",
    sort_order: 1,
    images: [
      "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1563630381190-77c336ea545a?q=80&w=1000&auto=format&fit=crop"
    ] // Placeholder using a generic clothing image
  },
  {
    product_id: 202,
    collection_id: 2,
    name: "Cipher Graphic Tee",
    slug: "cipher-graphic-tee",
    description: "Regular fit graphic tee featuring binary code motifs. High-density print.",
    category: "Baju",
    price: 175000,
    sizes: ["S", "M", "L", "XL"],
    status: "available",
    sort_order: 2,
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop"]
  },

  // Static Noise (collection_id: 3)
  {
    product_id: 301,
    collection_id: 3,
    name: "Interference Heavy Tee",
    slug: "interference-heavy-tee",
    description: "Boxy fit, heavyweight t-shirt with full front distressed graphics pattern.",
    category: "Baju",
    price: 210000,
    sizes: ["M", "L"],
    status: "sold_out",
    sort_order: 1,
    images: ["https://images.unsplash.com/photo-1622445275463-afa2ab738c34?q=80&w=800&auto=format&fit=crop"]
  },
  {
    product_id: 302,
    collection_id: 3,
    name: "Noise Trucker Cap",
    slug: "noise-trucker-cap",
    description: "Classic mesh-back trucker cap with a subversive embroidered patch.",
    category: "Topi hiphop",
    price: 140000,
    sizes: ["All Size"],
    status: "available",
    sort_order: 2,
    images: ["https://images.unsplash.com/photo-1556306535-0f09a536f0bl?q=80&w=800&auto=format&fit=crop"]
  }
];
