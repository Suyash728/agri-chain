# 🌿 AgriChain Design System Documentation (`DESIGN.md`)

Welcome to the official design system and architectural specification for **AgriChain** — the premium Web3 & AI-powered agricultural supply chain dashboard built for Indian farmers.

---

## 🎨 1. Design Aesthetics & Philosophy

The AgriChain dashboard combines organic agrarian warmth with modern glassmorphism, crisp card elevation, and vibrant 3D agrarian iconography.

### Core Aesthetic Pillars:
1. **Warm Organic Cream Palette**: Replaces sterile white backgrounds with comforting, natural cream and earth tones (`#FAF7F0`).
2. **3D Isolated Crop Artworks**: Clean 128x128 transparent RGBA PNG graphics bounded and framed inside white rounded cards (`bg-white rounded-2xl border border-[#E6E1D5] shadow-xs`).
3. **Seamless Ambient Shadows**: Feathered edge alpha blending for ground shadows without harsh box cutouts or text cross-contamination.
4. **Touch & Drag Safeguards**: Globally enforced `user-select: none`, `-webkit-user-drag: none`, and `pointer-events-none` on decorative graphics to ensure a native desktop app feel.

---

## 🎨 2. Color Palette & Design Tokens

### Surface & Background Tokens
| Token Name | Hex Code | Purpose & Application |
| :--- | :--- | :--- |
| **Canvas Cream Background** | `#FAF7F0` | Main application background surface |
| **Card White Surface** | `#FFFFFF` | Image containers, modal popups, floating header elements |
| **Warm Earth Border** | `#E6E1D5` | Default card borders and dividers |
| **Sage KPI Surface** | `#F4F5E6` | Total Inventory KPI Card background (`#E2E5D4` border) |
| **Peach KPI Surface** | `#FDF3E7` | Active Orders KPI Card background (`#F4E2CF` border) |
| **Ice Blue KPI Surface** | `#EBF3FA` | Shipments KPI Card background (`#D6E3F2` border) |
| **Lavender KPI Surface** | `#F4EEF8` | Total Earnings KPI Card background (`#E4D7EC` border) |

### Brand & Typography Tokens
| Token Name | Hex Code | Purpose & Application |
| :--- | :--- | :--- |
| **Deep Earth Text** | `#2D2620` | Primary headings, KPI numeric values, titles |
| **Muted Earth Label** | `#666057` | Subheadings, field labels, metadata |
| **Sage Green Accent** | `#556B2F` | Total Inventory unit badge, positive trends |
| **Terracotta Accent** | `#B85C38` | Active Orders badge, primary action buttons |
| **Transit Blue Accent** | `#2B6CB0` | Shipments status badge, logistics icons |
| **Purple Royalty Accent** | `#7C3AED` | Earnings value badge, financial indicators |

---

## 🔤 3. Typography Hierarchy

The design system utilizes Google Fonts **Inter** and **Outfit** for ultra-clean legibility across mobile, tablet, and desktop screens.

- **KPI Metric Values**: `text-2xl sm:text-3xl font-extrabold text-[#2D2620] tracking-tight`
- **Section Headings**: `text-xl sm:text-2xl font-bold text-[#2D2620]`
- **Card Title Text**: `text-sm font-bold text-[#2D2620]`
- **Metadata & Subtext**: `text-xs font-semibold text-[#666057]`

---

## 📊 4. Top KPI Summary Cards Specification

Located at the top of the main dashboard (`KPICards.jsx`), these 4 interactive summary cards display key operational metrics:

```
+------------------------+  +------------------------+  +------------------------+  +------------------------+
| Total Inventory        |  | Active Orders          |  | Shipments              |  | Total Earnings         |
| 3.45      [ Sack 🌾 ]  |  | 4         [ Clip 📋 ]  |  | 2        [ Truck 🚚 ]  |  | ₹ 28,450  [ Coins 💰 ] |
| Tonnes                 |  | Orders                 |  | In Transit             |  | This Month             |
+------------------------+  +------------------------+  +------------------------+  +------------------------+
```

1. **Total Inventory**:
   - **Background**: `#F4F5E6`
   - **Border**: `#E2E5D4`
   - **Metrics**: `3.45 Tonnes`
   - **Asset**: `/images/sack_kpi.png` (Transparent 3D burlap crop sack with green leaf emblem & wheat grains)
2. **Active Orders**:
   - **Background**: `#FDF3E7`
   - **Border**: `#F4E2CF`
   - **Metrics**: `4 Orders`
   - **Asset**: `/images/clipboard_kpi.png` (Transparent 3D wooden checklist clipboard with magnifying lens)
3. **Shipments**:
   - **Background**: `#EBF3FA`
   - **Border**: `#D6E3F2`
   - **Metrics**: `2 In Transit`
   - **Asset**: `/images/truck_kpi.png` (Transparent 3D blue delivery truck graphic)
4. **Total Earnings**:
   - **Background**: `#F4EEF8`
   - **Border**: `#E4D7EC`
   - **Metrics**: `₹ 28,450 This Month`
   - **Asset**: `/images/coins_kpi.png` (Transparent 3D stacked golden coins, 100% text/parenthesis free)

---

## 🌾 5. Crop Categories & Individual Crop Artwork Map

### A. Category Overview Cards (`cropIllustrationsMap`)
Each main crop category image is enclosed in a white rounded container box (`bg-white rounded-2xl border border-[#E6E1D5] shadow-xs p-2`):
- **Fruits**: `/images/fruits_ref.png` (2 Crops: Mango, Banana)
- **Vegetables**: `/images/vegetables_ref.png` (2 Crops: Tomato, Potato)
- **Grains**: `/images/grains_ref.png` (2 Crops: Wheat, Basmati Rice)
- **Pulses & Legumes**: `/images/pulses_ref.png` (2 Crops: Chickpea, Green Gram Moong)
- **Spices**: `/images/spices_ref.png` (2 Crops: Red Chilli, Turmeric)
- **Dry Fruits & Nuts**: `/images/dryfruits_ref.png` (2 Crops: Cashew, Roasted Almond)

### B. Individual Crop Artwork Map (`individualCropIllustrationsMap`)
All 12 individual crops feature 100% isolated, non-zero alpha transparent RGBA PNGs centered inside 128x128 canvases and white container boxes:

| Crop Name | Image File | Graphic Description |
| :--- | :--- | :--- |
| 🥭 **Mango** | `/images/mango_only.png` | 3D Alphonso mango with green leaf |
| 🍌 **Banana** | `/images/banana_only.png` | 3D yellow banana bunch |
| 🍅 **Tomato** | `/images/tomato_only.png` | 3D fresh red tomato |
| 🥔 **Potato** | `/images/potato_only.png` | 3D organic brown potato |
| 🌾 **Wheat** | `/images/wheat_only.png` | 3D golden wheat stalks |
| 🍚 **Rice** | `/images/rice_only.png` | 3D wooden bowl filled with basmati rice |
| 🧆 **Chickpea** | `/images/chickpea_only.png` | 3D ceramic bowl with golden garbanzo beans |
| 🟢 **Green Gram** | `/images/greengram_only.png` | 3D ceramic bowl with moong lentils |
| 🌶️ **Chilli** | `/images/chilli_only.png` | Realistic red chillies heap with green stems |
| 🟡 **Turmeric** | `/images/turmeric_only.png` | Realistic golden turmeric roots & powder heap |
| 🥜 **Cashew** | `/images/cashew_only.png` | Realistic raw cashew nuts heap |
| 🌰 **Almond** | `/images/almond_only.png` | Realistic roasted almonds heap |

---

## 🌿 6. Decorative Graphic Systems

1. **5-Leaf Plant Sprout (`plant_sprout_cleaned.png`)**:
   - Cleaned, edge-feathered 5-leaf botanical sprout graphic.
   - Sizing: `w-32 h-32 sm:w-44 sm:h-44`
   - Rendered with `draggable="false"` and `pointer-events-none`.
2. **Cute 3D Clay Sprout (`cute_plant_sprout.png`)**:
   - Cute 3D claymation chibi-styled plant sprout centered below the Dry Fruits & Nuts category card.

---

## 🛠️ 7. Component Architecture & File Tree

```
AgriChain/
├── public/images/                # 100% transparent RGBA crop & KPI artwork assets
│   ├── fruits_ref.png
│   ├── vegetables_ref.png
│   ├── grains_ref.png
│   ├── pulses_ref.png
│   ├── spices_ref.png
│   ├── dryfruits_ref.png
│   ├── mango_only.png
│   ├── banana_only.png
│   ├── tomato_only.png
│   ├── potato_only.png
│   ├── wheat_only.png
│   ├── rice_only.png
│   ├── chickpea_only.png
│   ├── greengram_only.png
│   ├── chilli_only.png
│   ├── turmeric_only.png
│   ├── cashew_only.png
│   ├── almond_only.png
│   ├── sack_kpi.png
│   ├── clipboard_kpi.png
│   ├── truck_kpi.png
│   ├── coins_kpi.png
│   ├── plant_sprout_cleaned.png
│   └── cute_plant_sprout.png
├── src/
│   ├── components/
│   │   ├── CropIllustrations.jsx  # SVG & PNG artwork wrappers
│   │   ├── KPICards.jsx           # Top 4 summary KPI cards
│   │   ├── Sidebar.jsx            # Desktop & mobile navigation sidebar
│   │   ├── Header.jsx             # Top search bar & user profile header
│   │   ├── Views/                 # Dashboard view pages (MyCrops, Inventory, Orders, etc.)
│   │   └── Modals/                # Interactive popup sheets & journey modals
│   ├── App.jsx                    # Root application component & view router
│   └── index.css                  # Global Tailwind CSS & unselectable image rules
├── DESIGN.md                      # System Design Specification Document
└── package.json
```

---

## 🚀 8. Build & Runtime Execution

- **Development Server**: `cmd /c npm run dev`
- **Production Bundle**: `cmd /c npm run build` (Verified 0-error Vite compilation into `dist/`)
- **Terminal Execution Requirement**: PowerShell execution policies on Windows require executing Node/NPM scripts via `cmd /c npm <command>`.

---
*AgriChain Design System Document v1.0 • Designed for Rahul Patil 🌿*
