<p align="center">
  <img src="public/images/Army%20logo.png" alt="Army SMP Logo" width="120" />
</p>

<h1 align="center">Army SMP Store ⚔️</h1>

<p align="center">
  <strong>Premium Minecraft Server Store — Buy Ranks, Keys, Crates & Coins</strong>
</p>

<p align="center">
  <a href="https://store.armysmp.fun">🌐 Live Store</a> &nbsp;•&nbsp;
  <a href="#-getting-started">⚡ Quick Start</a> &nbsp;•&nbsp;
  <a href="#-tech-stack">🛠️ Tech Stack</a> &nbsp;•&nbsp;
  <a href="#-security">🛡️ Security</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Cashfree-Payments-5C2D91?logo=cashapp&logoColor=white" alt="Cashfree" />
</p>

---

## 📋 Overview

Army SMP Store is a full-stack e-commerce platform built for the **Army SMP Minecraft server** community. It features a premium dark-themed UI with glassmorphism effects, real-time payment processing via Cashfree, a comprehensive admin dashboard with analytics, and enterprise-grade security with WAF + IPS + IP banning.

---

## ✨ Features

### 🛒 Store & Shopping
- **Category-based browsing** — Ranks, Keys, Crates, Coins with dynamic product grid
- **Product modal** — Quick view with features, descriptions and add-to-cart
- **Shopping cart drawer** — Slide-in cart with quantity controls and live total
- **Coupon system** — Apply discount codes at checkout with instant validation
- **Wishlist** — Save favorite items for later with persistent storage
- **Featured ranks carousel** — Animated promo slider for highlighted products

### 💳 Payments & Checkout
- **Cashfree integration** — Secure UPI, cards, net banking, and wallets
- **Real-time payment verification** — Server-side webhook validation
- **Order confirmation** — Canvas-based confetti celebration on success
- **PDF invoice generation** — Download professional invoices via jsPDF

### 📦 Order Management
- **Order history dashboard** — Statistics with animated counters (total orders, amount spent)
- **Order timeline** — Visual progress tracker (Pending → Processing → Completed)
- **Smart filters & sorting** — Filter by status, sort by date, search by order number
- **Re-order functionality** — Quick re-order with one click

### 👤 User Accounts & Auth
- **Multi-provider OAuth** — Google & Discord login via Passport.js
- **Email/Password auth** — Local registration with bcrypt hashing (12 rounds)
- **Email verification** — OTP-based email verification flow
- **Password reset** — Forgot password with secure OTP via email
- **User profiles** — Avatar upload (Cloudinary), Minecraft username linking, badge system
- **Referral system** — Unique referral codes, earnings tracking, balance-based discounts

### 🏆 Community Features
- **Leaderboard** — Top buyers ranked by spending and order count
- **Badge system** — Admin-assignable badges displayed on profiles
- **Push notifications** — Web push via service workers for order updates
- **Cookie consent** — GDPR-compliant consent banner

### 🔐 Admin Panel (2FA Protected)
- **Two-factor authentication** — Password + Email OTP verification
- **Sales analytics dashboard** — Revenue charts, order trends, real-time stats
- **Order management** — View, update status, update payment, bulk delete
- **Product management** — Full CRUD with image upload, categories, featured flags
- **Coupon management** — Create, edit, toggle, and track usage
- **Promotion management** — Slider banners with drag-to-reorder
- **User management** — View all users, assign badges, block/unblock accounts
- **Fraud detection dashboard** — Risk scores, fraud alerts, suspicious activity monitoring
- **Security dashboard** — WAF/IPS stats, banned IPs, real-time block logs

### 🛡️ Security

#### Web Application Firewall (WAF)
- SQL injection detection (20+ patterns)
- XSS/Cross-site scripting detection (20+ patterns)
- Path traversal & directory traversal blocking
- Command injection prevention
- Malicious bot/scanner detection (SQLMap, Nikto, Burp Suite, etc.) — auto 24h ban

#### Intrusion Prevention System (IPS)
- Rate-based attack detection (burst + per-minute limits)
- 404 scan detection (directory brute-force blocking)
- Brute force detection (auth failure tracking)
- Honeypot traps — 40+ fake paths (wp-login, phpmyadmin, .env, .git) — instant 1 week ban

#### IP Ban System
- **Persistent MongoDB-based bans** — survives server restarts
- **Admin login protection** — 2 wrong passwords = 1 week IP ban
- **Deceptive attempts display** — Shows fake "4 attempts remaining" to mislead attackers
- **Real-time precision** — Ban/unban exact to the millisecond, timezone-independent (UTC)
- **TTL auto-cleanup** — Expired bans automatically removed by MongoDB

#### Additional Security
- **Helmet.js** — CSP, HSTS (1 year), X-Frame-Options deny, no-sniff, XSS filter
- **JWT authentication** — Separate secrets for user/admin, admin tokens expire in 24h
- **Input sanitization** — HTML escape, XSS removal, dangerous pattern stripping
- **Rate limiting** — 100 req/15min general, 30/15min auth, 10/min payments
- **CORS whitelist** — Only approved origins allowed
- **bcrypt password hashing** — 12 salt rounds
- **Environment crash guard** — Server refuses to start without JWT secrets configured

### 🎨 UI/UX Design
- **Dark mode gaming aesthetic** — Premium dark theme with vibrant accents
- **Light/Dark toggle** — Smooth theme transitions, persisted in localStorage
- **Glassmorphism 2.0** — Frosted glass cards with animated gradient borders
- **3D hover effects** — Product cards with perspective tilt on hover
- **Micro-animations** — 10+ keyframes (scaleIn, bounceIn, blurIn, slideUp, etc.)
- **Scroll reveal** — Intersection Observer-based staggered reveal animations
- **Particle background** — Canvas-based floating particles on home page
- **Mobile-first responsive** — Fully optimized for all screen sizes
- **Bottom navigation bar** — Thumb-friendly mobile nav
- **Pull to refresh** — Touch gesture support for mobile
- **Gesture navigation** — Swipe gestures for enhanced mobile UX

### ⚡ Performance
- **Code splitting** — React.lazy + Suspense for all page routes
- **Image optimization** — Lazy loading with shimmer placeholders, error fallbacks
- **Route prefetching** — Preloads upcoming routes for instant navigation
- **Skeleton loaders** — Premium loading states throughout
- **Fluid typography** — Responsive text using CSS `clamp()`
- **PWA support** — Installable progressive web app with service worker

### 🔍 SEO
- **Dynamic meta tags** — Per-page title, description, Open Graph tags
- **Structured data** — JSON-LD schemas for Google Rich Results
- **Sitemap & robots.txt** — Search engine crawling optimization
- **Semantic HTML** — Proper heading hierarchy and HTML5 elements

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI framework |
| Vite | 7.2 | Build tool & dev server |
| React Router DOM | 7.10 | Client-side routing |
| Lucide React | 0.561 | Icon library |
| jsPDF | 4.2 | PDF invoice generation |
| Vanilla CSS | — | Styling with CSS variables & custom properties |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.21 | Web framework |
| MongoDB + Mongoose | 9.0 | Database & ODM |
| JWT (jsonwebtoken) | 9.0 | Authentication tokens |
| Passport.js | 0.7 | OAuth (Google, Discord) |
| bcryptjs | 3.0 | Password hashing |
| Helmet | 8.1 | Security headers |
| Cashfree PG | 5.1 | Payment gateway |
| Cloudinary | 2.8 | Image uploads |
| Nodemailer + Resend | — | Email (OTP, notifications) |
| web-push | 3.6 | Push notifications |
| rcon-client | 4.2 | Minecraft server communication |

### Hosting
| Service | Purpose |
|---------|---------|
| Vercel | Frontend deployment |
| Render | Backend deployment |
| MongoDB Atlas | Cloud database |
| Cloudinary | Image CDN |

---

## 📂 Project Structure

```
Army-SMP-2/
├── public/
│   ├── images/              # Static assets & product images
│   ├── robots.txt           # SEO crawling rules
│   └── sitemap.xml          # SEO sitemap
│
├── src/                     # Frontend (React + Vite)
│   ├── components/          # 30+ reusable UI components
│   │   ├── Navbar.jsx           # Top navigation with search
│   │   ├── Footer.jsx           # Site footer with links
│   │   ├── CartDrawer.jsx       # Slide-in shopping cart
│   │   ├── ProductCard.jsx      # Product grid cards
│   │   ├── ProductModal.jsx     # Quick view modal
│   │   ├── PromoSlider.jsx      # Featured promotions carousel
│   │   ├── FeaturedRanks.jsx    # Highlighted ranks section
│   │   ├── Leaderboard.jsx      # Top buyers leaderboard
│   │   ├── Confetti.jsx         # Order success celebration
│   │   ├── ThemeToggle.jsx      # Dark/Light mode switch
│   │   ├── MobileNav.jsx        # Bottom mobile navigation
│   │   ├── BackToTop.jsx        # Scroll-to-top button
│   │   ├── ErrorBoundary.jsx    # Global error handler
│   │   ├── NetworkStatus.jsx    # Offline/online detection
│   │   ├── OptimizedImage.jsx   # Lazy loaded images
│   │   ├── AnimatedSection.jsx  # Scroll reveal wrapper
│   │   ├── ParticleBackground.jsx # Canvas particles
│   │   ├── FilterDrawer.jsx     # Mobile filter panel
│   │   ├── ImageUploader.jsx    # Cloudinary upload
│   │   ├── CookieConsent.jsx    # GDPR cookie banner
│   │   ├── PWAInstallPrompt.jsx # PWA install prompt
│   │   ├── SEO.jsx              # Dynamic meta tags
│   │   ├── StructuredData.jsx   # JSON-LD schemas
│   │   └── Toast.jsx            # Notification toasts
│   │
│   ├── pages/               # Route pages (lazy loaded)
│   │   ├── Home.jsx             # Landing page
│   │   ├── Store.jsx            # Product catalog
│   │   ├── Checkout.jsx         # Payment flow
│   │   ├── OrderHistory.jsx     # Order tracking dashboard
│   │   ├── Profile.jsx          # User profile & settings
│   │   ├── Wishlist.jsx         # Saved items
│   │   ├── Login.jsx            # Email/OAuth login
│   │   ├── Signup.jsx           # Registration
│   │   ├── ForgotPassword.jsx   # Password reset request
│   │   ├── ResetPassword.jsx    # Password reset form
│   │   ├── VerifyEmail.jsx      # Email OTP verification
│   │   ├── ContactUs.jsx        # Contact page
│   │   ├── PrivacyPolicy.jsx    # Privacy policy
│   │   ├── RefundPolicy.jsx     # Refund policy
│   │   ├── TermsAndConditions.jsx # Terms of service
│   │   ├── NotFound.jsx         # 404 page
│   │   └── Admin/               # Admin panel
│   │       ├── AdminLogin.jsx       # 2FA login (password + OTP)
│   │       ├── index.jsx            # Admin dashboard
│   │       ├── AnalyticsDashboard.jsx # Sales analytics
│   │       ├── components/          # Admin-specific components
│   │       └── hooks/               # Admin-specific hooks
│   │
│   ├── context/             # React Context providers
│   │   ├── AuthContext.jsx      # Authentication state
│   │   ├── CartContext.jsx      # Shopping cart state
│   │   └── WishlistContext.jsx  # Wishlist state
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useDebounce.js           # Input debouncing
│   │   ├── useIntersectionObserver.js # Visibility detection
│   │   ├── useScrollReveal.js       # Scroll animations
│   │   ├── usePrefetch.js           # Route prefetching
│   │   ├── useGestureNavigation.js  # Swipe gestures
│   │   ├── useHaptics.js            # Haptic feedback
│   │   └── usePushNotifications.js  # Web push
│   │
│   ├── App.jsx              # Root app with routing & code splitting
│   ├── index.css            # Global styles, themes & design tokens
│   └── main.jsx             # Entry point
│
├── server/                  # Backend (Node.js + Express)
│   ├── models/              # MongoDB schemas
│   │   ├── User.js              # User accounts (auth, referrals, badges)
│   │   ├── Order.js             # Orders
│   │   ├── Product.js           # Products
│   │   ├── Coupon.js            # Discount coupons
│   │   ├── Promotion.js         # Promo banners
│   │   ├── Badge.js             # User badges
│   │   ├── OTP.js               # One-time passwords
│   │   ├── BannedIP.js          # IP ban records (persistent)
│   │   └── FraudAlert.js        # Fraud detection alerts
│   │
│   ├── routes/              # API endpoints
│   │   ├── admin.js             # Admin panel (orders, products, users, security)
│   │   ├── auth.js              # Login, signup, OAuth, password reset
│   │   ├── user.js              # Profile, referrals, badges
│   │   ├── orders.js            # Order creation & tracking
│   │   ├── products.js          # Product catalog
│   │   ├── cart.js              # Shopping cart
│   │   ├── coupons.js           # Coupon validation
│   │   ├── promotions.js        # Promo banners
│   │   ├── payment.js           # Cashfree payment processing
│   │   ├── upload.js            # Cloudinary image uploads
│   │   ├── fraud.js             # Fraud detection & alerts
│   │   ├── analytics.js         # Sales analytics
│   │   ├── leaderboard.js       # Top buyers
│   │   ├── notifications.js     # Push notification subscriptions
│   │   └── serverStatus.js      # Minecraft server status (RCON)
│   │
│   ├── middleware/           # Security & utility middleware
│   │   ├── waf.js               # Web Application Firewall
│   │   ├── ips.js               # Intrusion Prevention System
│   │   ├── authMiddleware.js    # JWT auth & admin auth
│   │   └── sanitize.js          # Input sanitization & rate limiting
│   │
│   ├── services/            # Business logic services
│   │   ├── email.js             # Email templates (OTP, order updates)
│   │   ├── passport.js          # OAuth strategy configuration
│   │   ├── fraudDetection.js    # Fraud scoring & risk analysis
│   │   ├── minecraft.js         # RCON server communication
│   │   ├── pushNotifications.js # Web push service
│   │   └── keepAlive.js         # Render keep-alive pings
│   │
│   ├── index.js             # Server entry point
│   └── package.json         # Backend dependencies
│
├── .env.example             # Environment variable template
├── package.json             # Frontend dependencies
└── vite.config.js           # Vite configuration
```

---

## ⚡ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- npm
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB)

### 1. Clone & Install

```bash
git clone https://github.com/PrincePrajapatiXi/Army-SMP-2.git
cd Army-SMP-2

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Setup

**Frontend** — Create `.env` in root:
```env
VITE_CASHFREE_ENV=sandbox
VITE_ADMIN_PATH=cp-your-secret-path
```

**Backend** — Create `server/.env.local`:
```env
# Database
MONGODB_URI=mongodb+srv://your-connection-string

# Authentication
JWT_SECRET=your-random-jwt-secret
ADMIN_JWT_SECRET=your-random-admin-jwt-secret
SESSION_SECRET=your-session-secret

# Admin Credentials
ADMIN_PASSWORD=your-admin-password
ADMIN_EMAIL=your-admin-email@example.com

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth (Discord)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Cloudinary (Image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Cashfree (Payments)
CASHFREE_APP_ID=your-app-id
CASHFREE_SECRET_KEY=your-secret-key

# Discord Webhook (Notifications)
DISCORD_WEBHOOK_URL=your-webhook-url

# Push Notifications (VAPID Keys)
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

### 3. Run Development Servers

```bash
# Terminal 1 — Frontend (http://localhost:5173)
npm run dev

# Terminal 2 — Backend (http://localhost:5000)
cd server
npm run dev
```

---

## 🎨 Customization

| What | Where |
|------|-------|
| Theme colors | `src/index.css` → `:root` CSS variables |
| Products | Admin Panel → Products (or `server/` via API) |
| Store branding | `public/images/logo.png` |
| Admin panel path | `.env` → `VITE_ADMIN_PATH` |
| Security thresholds | `server/middleware/ips.js` → `IPS_CONFIG` |
| Ban duration | `server/models/BannedIP.js` → `BAN_DURATION` |

---

## 🔌 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/promotions` | Get active promotions |
| GET | `/api/server-status` | Minecraft server status |
| GET | `/api/leaderboard` | Top buyers |
| POST | `/api/coupons/validate` | Validate coupon code |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Email/password login |
| GET | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/discord` | Discord OAuth |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| POST | `/api/auth/verify-email` | Verify email OTP |

### Protected (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update profile |
| POST | `/api/orders/checkout` | Create order |
| GET | `/api/orders/my-orders` | Get user's orders |
| POST | `/api/payment/create-order` | Initiate payment |

### Admin (Requires Admin JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login (step 1) |
| POST | `/api/admin/verify-2fa` | Admin 2FA (step 2) |
| GET | `/api/admin/stats` | Sales analytics |
| GET/PUT/DELETE | `/api/admin/orders/*` | Order management |
| GET/POST/PUT/DELETE | `/api/admin/products/*` | Product CRUD |
| GET/POST/PUT/DELETE | `/api/admin/coupons/*` | Coupon CRUD |
| GET | `/api/admin/users` | User management |
| GET | `/api/admin/security/*` | Security dashboard |

---

## 🚀 Deployment

### Frontend → Vercel
```bash
# Build command
npm run build

# Output directory
dist/
```

### Backend → Render
- **Build command**: `cd server && npm install`
- **Start command**: `cd server && npm start`
- **Environment**: Add all env variables from `.env.local`

---

## 📄 License

This project is proprietary software for Army SMP. Unauthorized distribution is prohibited.

---

<p align="center">
  Built with ❤️ for the Army SMP Community<br/>
  <sub>© 2025-2026 Army SMP. All rights reserved.</sub>
</p>
