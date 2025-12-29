# Army SMP Store ⚔️

![Army SMP Banner](public/images/logo.png)

Welcome to the official **Army SMP Store** – a modern, responsive, and high-performance React application built for the Army SMP Minecraft server community. Purchase Ranks, Keys, Crates, and Coins seamlessly!

🌐 **Live Site**: [armysmp2.vercel.app](https://armysmp2.vercel.app)

---

## 🚀 Features

### 🛒 Store System
- **Category-based UI** – Browse Ranks, Keys, Crates, Coins
- **Product Modal** – Fast and responsive product details view
- **Shopping Cart** – Add/remove items with quantity controls
- **Coupon System** – Apply discount codes at checkout

### 📦 Advanced Order History *(NEW)*
- **Statistics Dashboard** – Total orders, amount spent, top products with animated counters
- **Order Timeline** – Visual progress tracker (Pending → Processing → Completed)
- **Smart Filters** – Filter by status (All, Pending, Processing, Completed, Cancelled)
- **Sorting & Search** – Sort by date, search by order number
- **Expandable Details** – Click to view full order info with smooth animations
- **PDF Invoice Download** – Generate professional invoices using jsPDF
- **Re-order Functionality** – Quick re-order same items with one click
- **Glassmorphism UI** – Modern frosted glass design with micro-animations

### 🔍 Search with Auto-suggestions
- **Recent Searches** – Saved to localStorage
- **Popular Searches** – Quick access to trending items
- **Product Suggestions** – Live search with highlighted matching text
- **Keyboard Navigation** – Arrow keys + Enter + Escape support

### 🎉 Confetti Celebration
- Canvas-based confetti animation on order success
- 200+ colorful particles with physics simulation

### 💫 Smooth Page Transitions
- Fade + Slide animations between pages
- Respects reduced motion preferences

### ⚡ Performance Optimized
- **Code Splitting** – React.lazy for all pages
- **Skeleton Loaders** – Premium loading states
- **Lazy Loading** – Pages load on-demand

### 🎨 Premium UI/UX
- Dark mode gaming aesthetic
- Glassmorphism effects
- Mobile-first responsive design
- Promo slider with smooth animations

### 🔐 Admin Panel
- Secure password-protected access
- Sales analytics dashboard
- Order management
- Product management (CRUD)
- Coupon management

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React.js 18 |
| Build Tool | Vite |
| Styling | Vanilla CSS + CSS Variables |
| Icons | Lucide React |
| Routing | React Router DOM |
| Backend | Node.js + Express |
| Database | MongoDB |
| PDF Generation | jsPDF |
| Hosting | Vercel (Frontend) + Render (Backend) |

---

## 📂 Project Structure

```bash
src/
├── components/       # Reusable UI components
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── ProductCard.jsx
│   ├── CartDrawer.jsx
│   ├── Confetti.jsx      # Order success celebration
│   ├── PageTransition.jsx # Route animations
│   ├── PageLoader.jsx     # Lazy loading fallback
│   └── SkeletonCard.jsx   # Loading skeletons
├── context/          # React Context
│   └── CartContext.jsx
├── data/             # Static data
│   ├── products.js
│   └── coupons.js
├── pages/            # Route pages (lazy loaded)
│   ├── Home.jsx
│   ├── Store.jsx
│   ├── Checkout.jsx
│   ├── OrderHistory.jsx  # Advanced order tracking
│   └── Admin/
├── services/         # API services
├── App.jsx           # Main app with code splitting
├── index.css         # Global styles
└── main.jsx          # Entry point

server/
├── models/           # MongoDB schemas
├── routes/           # Express routes
└── index.js          # Server entry
```

---

## ⚡ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v16+
- npm or yarn
- MongoDB (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/PrincePrajapatiXi/Army-SMP-2.git
cd Army-SMP-2

# Install dependencies
npm install

# Run development server
npm run dev

# Open in browser
# http://localhost:5173/
```

### Backend Setup

```bash
cd server
npm install
npm start
# Server runs on http://localhost:5000
```

---

## 🎨 Customization

| What | Where |
|------|-------|
| Colors | `src/index.css` → `:root` variables |
| Products | `src/data/products.js` or Admin Panel |
| Server IP | `src/pages/Home.jsx` |
| Logo | `public/images/logo.png` |

---

## 📸 Screenshots

### Order History Dashboard
| Statistics | Timeline | Filters |
|------------|----------|---------|
| Animated counters | Step progress | Status tabs |
| Total orders/spent | Current step pulse | Sort & search |

---

## 📄 License

This project is proprietary software for Army SMP. Unauthorized distribution involves copyright infringement.

---

*Built with ❤️ for the Army SMP Community*
