# RollPoint — Complete Full-Stack E-Commerce Website

A production-ready full-stack e-commerce system with dynamic product catalog, thermal receipt order flow, direct WhatsApp ordering, customer reviews moderation, theme customization, and an integrated staff Admin Panel.

---

## 🚀 Key Features

### 🛍️ Customer Experience
- **Preserved Design & Typography**: Authentic receipt aesthetic using *Bricolage Grotesque*, *Instrument Sans*, and *IBM Plex Mono*.
- **Dynamic Catalog**: Products, pricing, discount calculations, specifications, and categories loaded directly from MongoDB Atlas.
- **Dynamic Product Detail Page (PDP)**: Multiple image thumbnails gallery, specifications table, stock indicator, and approved customer reviews.
- **Direct Checkout & Order Flow**:
  - No bloated cart; streamlined `Product → Order Now → Order Form` flow.
  - Required fields: Name, Phone (WhatsApp), Email (optional), Full Address, City.
  - **Fixed Shipping**: Flat `Rs. 250` nationwide shipping automatically computed.
  - **Unique Order IDs**: Auto-generated format: `ORD-YYYYMMDD-XXXX` (e.g. `ORD-20260917-0001`).
- **Automated WhatsApp Ordering**:
  - Automatically opens WhatsApp with a pre-filled, URL-encoded order message targeting `03089134302`.
- **Customer Reviews**:
  - Customers submit reviews directly on PDP. Reviews start in `pending` status for moderation.

---

### 🔐 Admin Panel & Management
- **Discreet Access**: Small "Admin" link in the website footer (`#/admin`).
- **Secure Authentication**: Bcrypt password hashing and JWT token authentication.
- **Dashboard Overview**: Key metrics (Total Revenue, Total Products, Pending/Confirmed/Delivered Orders, Pending Reviews) and recent orders stream.
- **Product Management (CRUD)**:
  - Add, edit, delete products.
  - Change prices, old prices, stock, categories, and descriptions.
  - Dynamic key-value specifications builder.
  - Multiple image upload & URL management.
  - One-click publish / unpublish toggle.
- **Order Management**:
  - View full customer address and contact details.
  - Filter orders by status (`Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`).
  - Search by Order ID, customer name, phone number, or city.
  - Direct 1-click WhatsApp customer chat link.
  - Live status updater.
- **Reviews Moderation**:
  - Filter reviews by status (`pending`, `approved`, `rejected`).
  - Approve, reject, or delete reviews.
  - Approving or rejecting reviews automatically recalculates the product's average rating and total review count.
- **Theme & Website Settings**:
  - Change website name, tagline, WhatsApp ordering number, contact details, business hours, and shipping rates without touching source code.
  - Live color pickers for Primary Accent Color and Secondary Theme Color.
  - Changes reflect immediately across the entire site.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), CSS Custom Properties, Lucide Icons, Single-Page Hash Router.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas (via Mongoose).
- **Authentication**: JSON Web Tokens (JWT), Bcrypt password hashing.
- **File Uploads**: Multer (stores in `public/uploads/` with cloud storage adaptability).

---

## 🔑 Default Admin Account

When starting the project for the first time with an empty database, an initial administrator account is automatically created:

- **Admin URL**: `http://localhost:5000/#/admin` (or click "Admin" in footer)
- **Email**: `admin@rollpoint.pk`
- **Password**: `admin123`

*(You can change these in `.env` or update the password in the admin panel)*

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and provide your MongoDB Atlas connection string:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/rollpoint?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
WHATSAPP_NUMBER=03089134302
WHATSAPP_INTL=923089134302
```

> **Note**: If `MONGODB_URI` is left blank during local development, an embedded in-memory database will run seamlessly so all features can be previewed immediately.

### 3. Start the Server
```bash
npm start
```

Open your browser and navigate to:
- **Storefront**: [http://localhost:5000](http://localhost:5000)
- **Admin Panel**: [http://localhost:5000/#/admin](http://localhost:5000/#/admin)

### 4. Run Test Suite
```bash
npm test
```

---

## 🌐 Deployment

### Backend (Render, Railway, Heroku, or VPS)
1. Set the environment variables (`MONGODB_URI`, `JWT_SECRET`, `WHATSAPP_NUMBER`, `NODE_ENV=production`) in your hosting dashboard.
2. Set the build command: `npm install`
3. Set the start command: `npm start`

### Frontend (Netlify, Vercel)
- If deploying frontend statically to Netlify and backend to Render/Railway:
  - Point API calls in `public/js/api.js` to your backend URL (e.g. `https://your-api.onrender.com/api`).
  - Set `CLIENT_URL=https://your-site.netlify.app` on the backend for CORS.
