# 🛠️ Full Stack E-Commerce Backend - Node.js + Express + MVC

This is the backend for the Full Stack E-Commerce application, built using **Node.js**, **Express**, and follows the **MVC architecture**. It uses **PostgreSQL** for users/orders and **MongoDB** for products.

## 🔧 Tech Stack

- **Node.js + Express**
- **PostgreSQL (via Prisma)**
- **MongoDB (via Mongoose)**
- **JWT + Bcrypt for Auth**
- **MVC Architecture**

## 📁 Project Structure

```
backend/
│
├── config/                  # Configuration files (e.g., DB, JWT)
├── controllers/             # Route controllers
├── database/                # Database connection files
│   ├── mongodb.js           # Mongoose config
│   └── postgreSQL.js        # Prisma PostgreSQL config
├── models/                  # (Handled via Prisma/Mongoose)
├── prisma/                  # Prisma schema and migrations
│   ├── migrations/
│   └── schema.prisma
├── public/                  # Public assets if any
├── routes/                  # Express route handlers
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   └── userRoutes.js
├── utils/                   # Utility files
│   ├── apiFeatures.js
│   ├── appError.js
│   ├── catchAsync.js
│   ├── email.js
│   ├── generateOTP.js
│   ├── jwtToken.js
│   └── sampleEmail.html
│
├── .env                     # Environment variables
├── .gitignore
├── app.js                   # Express app configuration
├── server.js                # Entry point for the server
├── package.json
├── package-lock.json
```

## 📦 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/prakash-dev-code/FullStackExam<yourname><date>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=<your_mongo_connection_string>
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET=your_jwt_secret
```

### 4. Set Up PostgreSQL with Prisma

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run MongoDB (Local or Atlas)

Ensure MongoDB is running or accessible via Atlas.

### 6. Run the Server

```bash
npm run dev
```

## ✅ Key Features Implemented

- ✅ Authentication with JWT and hashed passwords
- ✅ Product CRUD with MongoDB and aggregation
- ✅ Advanced MongoDB search (text/regex)
- ✅ Orders stored in PostgreSQL
- ✅ Checkout flow with cart clearing
- ✅ Pagination,sorting and serching
- ✅ Secure routes and validations
- ✅ Utility layer for error handling and JWT
- ✅ Prisma and Mongoose combined setup

## ✅ Example SQL Query

```sql
SELECT
  DATE(order_date) AS date,
  SUM(total_amount) AS daily_revenue
FROM orders
GROUP BY date
ORDER BY date DESC
LIMIT 7;
```

## ✅ MongoDB Aggregation Example

```js
Product.aggregate([
  { $group: { _id: "$category", totalSales: { $sum: "$price" } } }
])
```
