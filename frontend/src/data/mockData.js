export const farmerProfile = {
  name: "Rahul Patil",
  emoji: "🌿",
  role: "Farmer",
  farmName: "Patil Organic Farms",
  location: "Nashik, Maharashtra, India",
  farmSize: "25 Acres",
  certification: "100% Certified Organic (NPOP)",
  contact: "+91 98230 41190",
  email: "rahul.patil@agrichain.in",
  joiningDate: "Jan 2023",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
};

export const kpiMetrics = [
  {
    id: "inventory",
    title: "Total Inventory",
    value: "3.45",
    unit: "Tonnes",
    type: "inventory",
  },
  {
    id: "orders",
    title: "Active Orders",
    value: "4",
    unit: "Orders",
    type: "orders",
  },
  {
    id: "shipments",
    title: "Shipments",
    value: "2",
    unit: "In Transit",
    type: "shipments",
  },
  {
    id: "earnings",
    title: "Total Earnings",
    value: "₹ 28,450",
    unit: "This Month",
    type: "earnings",
  }
];

export const cropCategories = [
  {
    id: "fruits",
    name: "Fruits",
    count: 2,
    countLabel: "2 Crops",
    totalInventory: "1.25 Tonnes",
    totalValue: "₹12,500",
    crops: [
      { name: "Mango", quantity: "0.75 Tonnes", value: "₹7,500", status: "In Stock", quality: "Grade A Alphonso" },
      { name: "Banana", quantity: "0.50 Tonnes", value: "₹5,000", status: "In Stock", quality: "Grade A Robusta" }
    ]
  },
  {
    id: "vegetables",
    name: "Vegetables",
    count: 2,
    countLabel: "2 Crops",
    totalInventory: "1.20 Tonnes",
    totalValue: "₹4,800",
    crops: [
      { name: "Tomato", quantity: "0.60 Tonnes", value: "₹2,400", status: "In Stock", quality: "Fresh Red Hybrid" },
      { name: "Potato", quantity: "0.60 Tonnes", value: "₹2,400", status: "In Stock", quality: "Jyoti Organic" }
    ]
  },
  {
    id: "grains",
    name: "Grains",
    count: 2,
    countLabel: "2 Crops",
    totalInventory: "1.55 Tonnes",
    totalValue: "₹12,025",
    crops: [
      { name: "Wheat", quantity: "0.80 Tonnes", value: "₹6,400", status: "In Stock", quality: "Sharbati Golden" },
      { name: "Rice", quantity: "0.75 Tonnes", value: "₹5,625", status: "In Stock", quality: "Basmati Extra Long" }
    ]
  },
  {
    id: "pulses",
    name: "Pulses & Legumes",
    count: 2,
    countLabel: "2 Crops",
    totalInventory: "0.75 Tonnes",
    totalValue: "₹3,750",
    crops: [
      { name: "Chickpea", quantity: "0.40 Tonnes", value: "₹2,000", status: "In Stock", quality: "Kabuli Grade 1" },
      { name: "Green Gram", quantity: "0.35 Tonnes", value: "₹1,750", status: "In Stock", quality: "Moong Whole" }
    ]
  },
  {
    id: "spices",
    name: "Spices",
    count: 2,
    countLabel: "2 Crops",
    totalInventory: "0.55 Tonnes",
    totalValue: "₹6,600",
    crops: [
      { name: "Chilli", quantity: "0.25 Tonnes", value: "₹3,000", status: "In Stock", quality: "Guntur Red" },
      { name: "Turmeric", quantity: "0.30 Tonnes", value: "₹3,600", status: "In Stock", quality: "Salem High Curcumin" }
    ]
  },
  {
    id: "dryfruits",
    name: "Dry Fruits & Nuts",
    count: 2,
    countLabel: "2 Crops",
    totalInventory: "0.35 Tonnes",
    totalValue: "₹7,750",
    crops: [
      { name: "Cashew", quantity: "0.20 Tonnes", value: "₹4,000", status: "In Stock", quality: "W240 Organic" },
      { name: "Almond", quantity: "0.15 Tonnes", value: "₹3,750", status: "In Stock", quality: "Mamra Premium" }
    ]
  }
];

export const recentActivities = [
  {
    id: "act-1",
    type: "order",
    title: "Order #ORD1256",
    status: "Confirmed",
    statusType: "confirmed",
    date: "12 May, 2025",
    amount: "₹15,400"
  },
  {
    id: "act-2",
    type: "shipment",
    title: "Shipment #SHP5678",
    status: "In Transit",
    statusType: "intransit",
    date: "11 May, 2025",
    amount: "SafeXpress"
  },
  {
    id: "act-3",
    type: "order",
    title: "Order #ORD1255",
    status: "Pending",
    statusType: "pending",
    date: "10 May, 2025",
    amount: "₹2,400"
  },
  {
    id: "act-4",
    type: "payment",
    title: "Payment Received",
    status: "Completed",
    statusType: "payment",
    date: "09 May, 2025",
    amount: "₹12,450"
  }
];

export const inventorySummary = {
  totalVolume: "3.45",
  volumeUnit: "Tonnes",
  totalValue: "₹28,450"
};

export const inventoryItems = [
  { id: "inv-1", name: "Wheat", category: "Grains", categoryId: "grains", quantity: "0.80 Tonnes", rawKg: 800, value: "₹ 6,400", status: "High Stock" },
  { id: "inv-2", name: "Rice", category: "Grains", categoryId: "grains", quantity: "0.75 Tonnes", rawKg: 750, value: "₹ 5,625", status: "High Stock" },
  { id: "inv-3", name: "Tomato", category: "Vegetables", categoryId: "vegetables", quantity: "0.60 Tonnes", rawKg: 600, value: "₹ 2,400", status: "Medium Stock" },
  { id: "inv-4", name: "Chickpea", category: "Pulses", categoryId: "pulses", quantity: "0.40 Tonnes", rawKg: 400, value: "₹ 2,000", status: "Low Stock" },
  { id: "inv-5", name: "Mango", category: "Fruits", categoryId: "fruits", quantity: "0.50 Tonnes", rawKg: 500, value: "₹ 6,000", status: "High Stock" }
];

export const ordersList = [
  {
    id: "ORD1256",
    buyer: "FreshMart Supply Co.",
    items: "Wheat (500 kg), Rice (300 kg)",
    date: "12 May, 2025",
    status: "Confirmed",
    statusType: "confirmed",
    totalAmount: "₹15,400"
  },
  {
    id: "ORD1255",
    buyer: "Green Valley Traders",
    items: "Tomato (400 kg)",
    date: "10 May, 2025",
    status: "Pending",
    statusType: "pending",
    totalAmount: "₹2,400"
  },
  {
    id: "ORD1254",
    buyer: "Daily Needs Store",
    items: "Potato (600 kg)",
    date: "09 May, 2025",
    status: "In Progress",
    statusType: "inprogress",
    totalAmount: "₹3,600"
  },
  {
    id: "ORD1253",
    buyer: "Metro Organic Hub",
    items: "Mango (200 kg), Banana (300 kg)",
    date: "05 May, 2025",
    status: "Completed",
    statusType: "confirmed",
    totalAmount: "₹7,050"
  }
];

export const shipmentsList = [
  {
    id: "SHP5678",
    orderId: "ORD1256",
    transporter: "SafeXpress",
    date: "12 May, 2025",
    status: "In Transit",
    statusType: "intransit",
    temp: "18.4°C",
    humidity: "62%",
    gps: "NH-48 Hwy, km 142"
  },
  {
    id: "SHP5677",
    orderId: "ORD1254",
    transporter: "Delhivery Logistics",
    date: "09 May, 2025",
    status: "Delivered",
    statusType: "delivered",
    temp: "21.0°C",
    humidity: "58%",
    gps: "Dark Store #4 - Pune North"
  }
];

export const traceabilityBatch = {
  batchId: "WH-120525-01",
  product: "Wheat",
  quantity: "500 kg",
  harvestDate: "05 May, 2025",
  currentLocation: "On the way to Dark Store",
  farmDetails: "Field Block C, Patil Organic Farms, Nashik",
  steps: [
    { step: 1, name: "Farm Registration", status: "Completed", timestamp: "05 May, 09:00 AM", location: "Nashik, MH" },
    { step: 2, name: "Harvest & QC", status: "Completed", timestamp: "06 May, 02:30 PM", location: "Nashik, MH" },
    { step: 3, name: "Processing & Packaging", status: "Completed", timestamp: "08 May, 11:15 AM", location: "Processing Hub #2" },
    { step: 4, name: "Transport Dispatch", status: "In Transit", timestamp: "11 May, 06:00 AM", location: "NH-48 Hwy" },
    { step: 5, name: "Dark Store Arrival", status: "Pending", timestamp: "Expected 13 May", location: "Dark Store #4" }
  ]
};

export const aiTrustData = {
  score: 92,
  maxScore: 100,
  level: "High Trust",
  status: "Safe & Trustworthy",
  lastVerified: "10 mins ago",
  aiVerificationDetails: [
    { title: "Cold Chain Integrity", status: "100% Compliant (16-20°C Range)" },
    { title: "GPS Telemetry Validation", status: "Route Verified & Continuous" },
    { title: "Tamper Prevention", status: "Smart Seal Intact" },
    { title: "Anomaly Check", status: "0 Deviations Flagged" }
  ]
};

export const earningsSummary = {
  totalRevenue: "₹1,48,500",
  totalThisMonth: "₹28,450",
  growthPercentage: "+18.4%",
  growthPeriod: "vs last month",
  pendingPayouts: "₹15,400",
  completedTxns: 18,
  breakdown: [
    { category: "Grains (Wheat & Rice)", amount: "₹12,025", percent: 42 },
    { category: "Fruits (Mango & Banana)", amount: "₹7,500", percent: 26 },
    { category: "Spices (Chilli & Turmeric)", amount: "₹4,200", percent: 15 },
    { category: "Vegetables (Tomato & Potato)", amount: "₹4,725", percent: 17 }
  ]
};
