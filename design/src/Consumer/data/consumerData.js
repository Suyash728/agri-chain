// Consumer Application Mock Data Specification

export const consumerCategories = [
  { id: 'fruits', name: 'Fruits', count: 25, icon: '🍎', image: '/images/fruits_ref.png', bg: '#FDF3E7' },
  { id: 'vegetables', name: 'Vegetables', count: 32, icon: '🥦', image: '/images/vegetables_ref.png', bg: '#F4F5E6' },
  { id: 'grains', name: 'Grains', count: 20, icon: '🌾', image: '/images/grains_ref.png', bg: '#FAF5E8' },
  { id: 'pulses', name: 'Pulses & Legumes', count: 22, icon: '🫘', image: '/images/toor_dal.png', bg: '#FAF5E8' },
  { id: 'dairy', name: 'Dairy & Eggs', count: 18, icon: '🥛', image: '/images/coins_kpi.png', bg: '#EBF3FA' },
  { id: 'spices', name: 'Spices', count: 24, icon: '🌶️', image: '/images/spices_ref.png', bg: '#FDF0EC' },
  { id: 'dryfruits', name: 'Dry Fruits & Nuts', count: 20, icon: '🥜', image: '/images/dryfruits_ref.png', bg: '#F7EEFA' },
];

export const consumerProducts = [
  // 1. Fruits
  {
    id: 'mango-1',
    name: 'Alphonso Mango',
    weight: '1 kg',
    price: 120,
    rating: 4.6,
    reviewsCount: 128,
    category: 'fruits',
    isBestSeller: true,
    isFavorite: true,
    image: '/images/mango.png',
    origin: 'Ratnagiri, Maharashtra',
    batchId: 'MG9821'
  },
  {
    id: 'apple-1',
    name: 'Shimla Royal Apple',
    weight: '1 kg (4-5 pcs)',
    price: 180,
    rating: 4.7,
    reviewsCount: 92,
    category: 'fruits',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/apple.png',
    origin: 'Shimla, Himachal Pradesh',
    batchId: 'AP4410'
  },
  {
    id: 'banana-1',
    name: 'Robusta Banana',
    weight: '1 kg (6-7 pcs)',
    price: 50,
    rating: 4.5,
    reviewsCount: 140,
    category: 'fruits',
    isBestSeller: true,
    isFavorite: false,
    image: '/images/banana.png',
    origin: 'Jalgaon, Maharashtra',
    batchId: 'BN2201'
  },
  {
    id: 'pomegranate-1',
    name: 'Bhagwa Pomegranate',
    weight: '1 kg',
    price: 160,
    rating: 4.8,
    reviewsCount: 76,
    category: 'fruits',
    isBestSeller: false,
    isFavorite: true,
    image: '/images/fruits_ref.png',
    origin: 'Solapur, Maharashtra',
    batchId: 'PM5530'
  },

  // 2. Vegetables
  {
    id: 'tomato-1',
    name: 'Organic Tomato',
    weight: '1 kg',
    price: 40,
    rating: 4.4,
    reviewsCount: 95,
    category: 'vegetables',
    isBestSeller: true,
    isFavorite: true,
    image: '/images/tomato.png',
    origin: 'Nashik, Maharashtra',
    batchId: 'TM1256'
  },
  {
    id: 'potato-1',
    name: 'Fresh Potato',
    weight: '1 kg',
    price: 25,
    rating: 4.5,
    reviewsCount: 110,
    category: 'vegetables',
    isBestSeller: true,
    isFavorite: false,
    image: '/images/potato.png',
    origin: 'Satara, Maharashtra',
    batchId: 'PT4412'
  },
  {
    id: 'spinach-1',
    name: 'Spinach (Palak)',
    weight: '1 bunch (250g)',
    price: 25,
    rating: 4.3,
    reviewsCount: 64,
    category: 'vegetables',
    isBestSeller: false,
    isFavorite: true,
    image: '/images/vegetables_ref.png',
    origin: 'Pune, Maharashtra',
    batchId: 'SP8821'
  },
  {
    id: 'capsicum-1',
    name: 'Green Capsicum',
    weight: '500 g',
    price: 35,
    rating: 4.6,
    reviewsCount: 58,
    category: 'vegetables',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/vegetables_ref.png',
    origin: 'Nashik, Maharashtra',
    batchId: 'CP9912'
  },
  {
    id: 'carrot-1',
    name: 'Organic Orange Carrot',
    weight: '500 g',
    price: 30,
    rating: 4.4,
    reviewsCount: 82,
    category: 'vegetables',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/vegetables_ref.png',
    origin: 'Ooty, Tamil Nadu',
    batchId: 'CR3310'
  },

  // 3. Grains & Pulses (Grains + Pulses)
  {
    id: 'rice-1',
    name: 'Basmati Rice',
    weight: '1 kg',
    price: 90,
    rating: 4.7,
    reviewsCount: 142,
    category: 'grains',
    isBestSeller: false,
    isFavorite: true,
    image: '/images/rice.png',
    origin: 'Karnal, Haryana',
    batchId: 'RC5510'
  },
  {
    id: 'wheat-1',
    name: 'Sharbati Whole Wheat Atta',
    weight: '5 kg',
    price: 260,
    rating: 4.8,
    reviewsCount: 210,
    category: 'grains',
    isBestSeller: true,
    isFavorite: false,
    image: '/images/wheat_atta.png',
    origin: 'Sehore, Madhya Pradesh',
    batchId: 'WT8820'
  },
  {
    id: 'toor-dal-1',
    name: 'Unpolished Toor / Arhar Dal',
    weight: '1 kg',
    price: 155,
    rating: 4.7,
    reviewsCount: 185,
    category: 'pulses',
    isBestSeller: true,
    isFavorite: true,
    image: '/images/toor_dal.png',
    origin: 'Latur, Maharashtra',
    batchId: 'TD1090'
  },
  {
    id: 'moong-dal-1',
    name: 'Unpolished Moong Dal',
    weight: '500 g',
    price: 79,
    rating: 4.6,
    reviewsCount: 94,
    category: 'pulses',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/moong_dal.png',
    origin: 'Bikaner, Rajasthan',
    batchId: 'MD7732'
  },
  {
    id: 'chana-dal-1',
    name: 'Unpolished Chana Dal',
    weight: '1 kg',
    price: 110,
    rating: 4.6,
    reviewsCount: 120,
    category: 'pulses',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/grains_ref.png',
    origin: 'Akola, Maharashtra',
    batchId: 'CD3311'
  },


  // 5. Spices
  {
    id: 'turmeric-1',
    name: 'Organic Turmeric Powder (Haldi)',
    weight: '250 g',
    price: 65,
    rating: 4.8,
    reviewsCount: 98,
    category: 'spices',
    isBestSeller: true,
    isFavorite: false,
    image: '/images/turmeric.png',
    origin: 'Sangli, Maharashtra',
    batchId: 'SP1010'
  },
  {
    id: 'chilli-1',
    name: 'Kashmiri Red Chilli Powder',
    weight: '200 g',
    price: 85,
    rating: 4.7,
    reviewsCount: 112,
    category: 'spices',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/chilli.png',
    origin: 'Guntur, Andhra Pradesh',
    batchId: 'SP2020'
  },
  {
    id: 'cumin-1',
    name: 'Whole Cumin Seeds (Jeera)',
    weight: '200 g',
    price: 95,
    rating: 4.6,
    reviewsCount: 84,
    category: 'spices',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/spices_ref.png',
    origin: 'Unjha, Gujarat',
    batchId: 'SP3030'
  },

  // 6. Dry Fruits
  {
    id: 'almond-1',
    name: 'California Almonds (Badam)',
    weight: '250 g',
    price: 240,
    rating: 4.8,
    reviewsCount: 175,
    category: 'dryfruits',
    isBestSeller: true,
    isFavorite: true,
    image: '/images/almond.png',
    origin: 'Kashmir Valley',
    batchId: 'DF1100'
  },
  {
    id: 'cashew-1',
    name: 'Whole King Cashews (Kaju W240)',
    weight: '250 g',
    price: 290,
    rating: 4.9,
    reviewsCount: 140,
    category: 'dryfruits',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/cashew.png',
    origin: 'Goa',
    batchId: 'DF2200'
  },
  {
    id: 'raisins-1',
    name: 'Golden Kishmish Raisins',
    weight: '250 g',
    price: 110,
    rating: 4.6,
    reviewsCount: 68,
    category: 'dryfruits',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/dryfruits_ref.png',
    origin: 'Sangli, Maharashtra',
    batchId: 'DF3300'
  },

  // 7. Oils
  {
    id: 'mustard-oil-1',
    name: 'Cold Pressed Mustard Oil',
    weight: '1 L bottle',
    price: 185,
    rating: 4.7,
    reviewsCount: 95,
    category: 'oils',
    isBestSeller: true,
    isFavorite: false,
    image: '/images/sack_kpi.png',
    origin: 'Bharatpur, Rajasthan',
    batchId: 'OL1010'
  },
  {
    id: 'sunflower-oil-1',
    name: 'Refined Sunflower Oil',
    weight: '1 L pouch',
    price: 140,
    rating: 4.5,
    reviewsCount: 118,
    category: 'oils',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/sack_kpi.png',
    origin: 'Latur, Maharashtra',
    batchId: 'OL2020'
  },

  // 8. Others
  {
    id: 'honey-1',
    name: 'Raw Forest Wild Honey',
    weight: '250 g jar',
    price: 195,
    rating: 4.9,
    reviewsCount: 156,
    category: 'others',
    isBestSeller: true,
    isFavorite: true,
    image: '/images/clipboard_kpi.png',
    origin: 'Western Ghats Forest',
    batchId: 'OT1010'
  },
  {
    id: 'jaggery-1',
    name: 'Organic Chemical-Free Jaggery (Gud)',
    weight: '500 g',
    price: 60,
    rating: 4.7,
    reviewsCount: 88,
    category: 'others',
    isBestSeller: false,
    isFavorite: false,
    image: '/images/clipboard_kpi.png',
    origin: 'Kolhapur, Maharashtra',
    batchId: 'OT2020'
  }
];

export const initialCartItems = [
  { id: 'tomato-1', name: 'Tomato', weight: '1 kg', price: 40, quantity: 1, image: '/images/vegetables_ref.png' },
  { id: 'potato-1', name: 'Potato', weight: '2 kg', price: 25, quantity: 2, image: '/images/vegetables_ref.png' },
  { id: 'spinach-1', name: 'Spinach', weight: '1 bunch', price: 25, quantity: 1, image: '/images/vegetables_ref.png' }
];

export const initialOrders = [
  {
    id: 'ORD1256',
    date: '12 May, 2025',
    status: 'Delivered',
    statusBg: 'bg-[#EBF3E8] text-[#556B2F]',
    total: 115,
    itemsCount: 4,
    items: [
      { name: 'Tomato', weight: '1 kg', price: 40 },
      { name: 'Potato', weight: '2 kg', price: 50 },
      { name: 'Spinach', weight: '1 bunch', price: 25 }
    ],
    thumbnails: ['/images/vegetables_ref.png', '/images/vegetables_ref.png', '/images/vegetables_ref.png']
  },
  {
    id: 'ORD1255',
    date: '10 May, 2025',
    status: 'Delivered',
    statusBg: 'bg-[#EBF3E8] text-[#556B2F]',
    total: 250,
    itemsCount: 3,
    items: [
      { name: 'Alphonso Mango', weight: '1 kg', price: 120 },
      { name: 'Cow Milk', weight: '1 L', price: 45 },
      { name: 'Basmati Rice', weight: '1 kg', price: 85 }
    ],
    thumbnails: ['/images/fruits_ref.png', '/images/coins_kpi.png', '/images/grains_ref.png']
  },
  {
    id: 'ORD1254',
    date: '08 May, 2025',
    status: 'In Transit',
    statusBg: 'bg-[#EBF3FA] text-[#2B6CB0]',
    total: 180,
    itemsCount: 4,
    items: [
      { name: 'Spices Mix', weight: '500g', price: 80 },
      { name: 'Organic Tomato', weight: '1 kg', price: 40 },
      { name: 'Fresh Potato', weight: '2 kg', price: 60 }
    ],
    thumbnails: ['/images/spices_ref.png', '/images/fruits_ref.png', '/images/vegetables_ref.png']
  }
];

export const productJourneyTimeline = [
  { title: 'Harvested', date: '05 May, 2025', location: 'Nashik Farm', status: 'completed' },
  { title: 'Processed', date: '06 May, 2025', location: 'Nashik Packing Unit', status: 'completed' },
  { title: 'Transported', date: '07 May, 2025', location: 'Green Valley Logistics', status: 'completed' },
  { title: 'Received at Dark Store', date: '08 May, 2025', location: 'Nashik Central Store', status: 'completed' },
  { title: 'Out for Delivery', date: '09 May, 2025', location: 'Local Courier Service', status: 'completed' },
  { title: 'Delivered', date: '10 May, 2025', location: 'Customer Doorstep', status: 'completed' }
];

export const productReviewsData = {
  'Alphonso Mango': {
    rating: 4.6,
    reviewsCount: 128,
    breakdown: [
      { stars: 5, percentage: 72 },
      { stars: 4, percentage: 18 },
      { stars: 3, percentage: 6 },
      { stars: 2, percentage: 2 },
      { stars: 1, percentage: 2 }
    ],
    reviews: [
      { id: 'r1', author: 'Neha Joshi', badge: 'Verified Buyer', rating: 5.0, comment: 'Great taste and very fresh mangoes. Packaging was also excellent.', date: '12 May, 2025' },
      { id: 'r2', author: 'Vikram Sharma', badge: 'Verified Buyer', rating: 5.0, comment: 'Authentic Ratnagiri Alphonso flavor! Quick delivery from dark store.', date: '10 May, 2025' }
    ]
  },
  'Organic Tomato': {
    rating: 4.4,
    reviewsCount: 95,
    breakdown: [
      { stars: 5, percentage: 65 },
      { stars: 4, percentage: 25 },
      { stars: 3, percentage: 6 },
      { stars: 2, percentage: 2 },
      { stars: 1, percentage: 2 }
    ],
    reviews: [
      { id: 'r3', author: 'Rahul Verma', badge: 'Verified Buyer', rating: 5.0, comment: 'Super fresh, firm tomatoes! Perfect for salads and curries.', date: '11 May, 2025' },
      { id: 'r4', author: 'Priya Patel', badge: 'Verified Buyer', rating: 4.0, comment: 'Organic quality is noticeable. Traceability scan matched Nashik farm.', date: '09 May, 2025' }
    ]
  },
  'Fresh Potato': {
    rating: 4.5,
    reviewsCount: 110,
    breakdown: [
      { stars: 5, percentage: 70 },
      { stars: 4, percentage: 20 },
      { stars: 3, percentage: 7 },
      { stars: 2, percentage: 2 },
      { stars: 1, percentage: 1 }
    ],
    reviews: [
      { id: 'r5', author: 'Amit K.', badge: 'Verified Buyer', rating: 5.0, comment: 'Clean, mud-free fresh potatoes. Great quality for everyday cooking.', date: '08 May, 2025' }
    ]
  },
  'Basmati Rice': {
    rating: 4.7,
    reviewsCount: 142,
    breakdown: [
      { stars: 5, percentage: 80 },
      { stars: 4, percentage: 14 },
      { stars: 3, percentage: 4 },
      { stars: 2, percentage: 1 },
      { stars: 1, percentage: 1 }
    ],
    reviews: [
      { id: 'r6', author: 'Suresh Menon', badge: 'Verified Buyer', rating: 5.0, comment: 'Long grain aromatic basmati rice. Premium Karnal harvest.', date: '07 May, 2025' }
    ]
  },
  'Cow Milk': {
    rating: 4.5,
    reviewsCount: 88,
    breakdown: [
      { stars: 5, percentage: 68 },
      { stars: 4, percentage: 22 },
      { stars: 3, percentage: 7 },
      { stars: 2, percentage: 2 },
      { stars: 1, percentage: 1 }
    ],
    reviews: [
      { id: 'r7', author: 'Ananya Roy', badge: 'Verified Buyer', rating: 4.5, comment: 'Pure fresh cow milk delivered daily at 6 AM.', date: '06 May, 2025' }
    ]
  }
};

export const sampleReviews = productReviewsData['Alphonso Mango'].reviews;
export const ratingBreakdown = productReviewsData['Alphonso Mango'].breakdown;

export const userProfileData = {
  name: 'Rahul Patil',
  location: 'Nashik, Maharashtra',
  email: 'rahul.patil@agrichain.com',
  phone: '+91 98765 43210',
  avatar: '/images/fruits_ref.png'
};

export const revenueData = {
  totalRevenue: '₹ 11,28,450',
  growth: '↑ 15% from last month',
  totalOrders: 320,
  avgOrderValue: '₹ 1,480',
  grossProfit: '₹ 3,46,200',
  netProfit: '₹ 2,12,600'
};
