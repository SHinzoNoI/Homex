# HomeX v2.0 — Construction Materials Platform

A funded startup-level MERN stack platform for rapid construction material delivery.

## 🚀 What's New in v2.0

### Backend
- **Mobile OTP Authentication** — Phone-based login with 6-digit OTP (bcrypt-hashed, 10-min TTL)
- **Socket.io** — Real-time order status updates, rider location, order room subscriptions
- **Server-Side Cart** — Full Cart model with weight-based delivery charges, GST (18%), coupon validation
- **Delivery Pricing Engine** — Weight tiers: 0-50kg=FREE, 51-200kg=₹50, 201-500kg=₹120, 500kg+=₹250
- **Idempotency Keys** — Prevents duplicate order submissions from double-clicks/retries
- **Delivery OTP** — 6-digit OTP generated per order, verified by rider before marking delivered
- **Order Rating System** — Product + rider ratings, auto-updates rider average rating
- **Return Request System** — Customers can request returns on delivered orders
- **Reorder** — One-click reorder adds previous order items to cart
- **Role-Secured Role Escalation Fix** — Public registration hardcoded to 'customer'
- **MongoDB Atomic Stock** — Per-item atomic stock decrement with rollback
- **Extended Models** — User (phone, gstNumber, addresses[], siteNames[], wallet), Order (deliveryOTP, deliveryCharge, totalWeight, gstAmount, idempotencyKey, ratings, returnRequest), Rider (location, earnings, isOnline)

### Frontend
- **OTP Login UI** — Phone input → 6-digit OTP input with resend timer, dev OTP display
- **Server-Synced Cart** — Optimistic updates, server recalculation on every change
- **Backend Search/Sort/Filter** — All product filtering moved to API params, debounced search
- **Protected /orders route** — Requires authentication
- **Socket.io Context** — Real-time order updates for active orders
- **Order Actions** — Cancel, Rate, Return Request, Reorder all wired up
- **RiderPanel OTP Modal** — Rider verifies 6-digit customer OTP to confirm delivery
- **Build Fix** — Resolved duplicate `AnimatePresence` import causing Vite build failure
- **API.js** — Added all new endpoints: cart, OTP, socket, ratings, return, reorder, profile

## 📦 Project Structure

```
homex/
├── server/                   # Node/Express API
│   ├── config/
│   │   ├── db.js             # MongoDB connection
│   │   └── socket.js         # Socket.io init + rooms
│   ├── controllers/
│   │   ├── authController.js  # Login, OTP, register, profile
│   │   ├── cartController.js  # Server-side cart + recalculation
│   │   ├── orderController.js # Full order lifecycle
│   │   ├── productController.js
│   │   ├── riderController.js
│   │   ├── couponController.js
│   │   └── userController.js
│   ├── models/
│   │   ├── User.js    ← extended: phone, gstNumber, addresses
│   │   ├── Order.js   ← extended: OTP, weight, GST, ratings, return
│   │   ├── Product.js
│   │   ├── Rider.js   ← extended: location, earnings
│   │   ├── Cart.js    ← NEW: server-side cart
│   │   ├── OTP.js     ← NEW: OTP with TTL index
│   │   ├── Coupon.js
│   │   └── Category.js
│   ├── routes/        # All routes with role middleware
│   ├── middleware/    # auth, errorHandler, rateLimiter, validate
│   ├── utils/
│   │   ├── apiResponse.js
│   │   └── deliveryPricing.js ← NEW: weight tiers + GST
│   └── index.js       ← socket.io integrated
│
└── client/                   # React + Vite frontend
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.jsx  ← OTP flow added
    │   │   ├── CartContext.jsx  ← server-synced
    │   │   └── SocketContext.jsx ← NEW: real-time
    │   ├── pages/
    │   │   ├── Login.jsx        ← OTP + email modes
    │   │   ├── Shop.jsx         ← backend search/sort/filter
    │   │   ├── Orders.jsx       ← cancel/rate/return/reorder
    │   │   ├── RiderPanel.jsx   ← OTP confirmation
    │   │   ├── AdminDashboard.jsx
    │   │   └── Landing.jsx      ← build fix
    │   ├── components/
    │   └── services/api.js      ← all endpoints
```

## 🔧 Setup

### Server
```bash
cd server
npm install
cp .env.example .env    # edit MONGO_URI, JWT_SECRET
npm run seed            # seed products, riders, admin user
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```

### Demo Accounts (after seed)
| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | admin@homex.in      | admin123  |
| Rider | rider@homex.in      | rider123  |

For customer login: use OTP flow with any 10-digit number (OTP shown in dev mode)

## 🗺️ Remaining for Full Production

1. **SMS Integration** — Connect MSG91/Fast2SMS to `smsService.js` for real OTP delivery
2. **Razorpay Payment** — Add `paymentController.js` with webhook signature verification
3. **GST Invoice PDF** — `pdfService.js` using pdfkit for invoice generation + S3 storage
4. **Delivery App** — Separate PWA with GPS tracking, push notifications (FCM)
5. **Live Map Tracking** — Leaflet.js + socket rider location in TrackOrder page
6. **MongoDB Transactions** — Replace manual stock rollback with `session.withTransaction()`
7. **Refresh Token** — Add HttpOnly cookie refresh token flow
8. **Tests** — Jest unit tests for pricing logic, integration tests for critical flows
9. **CI/CD** — GitHub Actions → Docker → AWS/Railway deploy pipeline
