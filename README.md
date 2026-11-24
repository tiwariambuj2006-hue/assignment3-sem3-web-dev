# Inventory and Data Management System

A RESTful inventory backend built for Assignment 3 (Web Dev III, Unit 3) using Node.js, Express.js, MongoDB, Mongoose and dotenv.

## Features

- Mongoose product schema with field validation, timestamps and `stockValue` virtual.
- Create, read, update and delete products.
- Search and filter by category, product name, SKU or supplier.
- Price range filtering, sorting and pagination.
- Low-stock report (`quantity <= reorderLevel`).
- Category-wise aggregation summary.
- Safe stock increment/decrement endpoint that prevents negative stock.
- Centralized error handling and request validation.
- Environment variables loaded through dotenv.

## Requirements

- Node.js 18 or later (Node.js 20 LTS recommended).
- npm.
- MongoDB Community Server running locally, or a MongoDB connection URI.
- Postman, Thunder Client or curl for API testing.

## Project structure

```text
inventory-data-management-system/
├── config/
│   └── db.js
├── middleware/
│   ├── errorHandler.js
│   └── validateProduct.js
├── models/
│   └── product.js
├── routes/
│   └── productRoutes.js
├── docs/
│   └── original-supplied-code.txt
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Setup and start

1. Install Node.js and MongoDB.
2. Start the MongoDB service. For a local MongoDB installation, the default URI below should work.
3. Open a terminal in this project folder.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Check `.env`. The included local defaults are:

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/inventory_management
   ```

   If using MongoDB Atlas or another database, replace `MONGO_URI` with your own connection string. Keep credentials private and do not commit `.env`.

6. Start the API:

   ```bash
   npm start
   ```

   For development with Node's watch mode:

   ```bash
   npm run dev
   ```

7. Open `http://localhost:5000/`. Expected response:

   ```json
   {
     "message": "Inventory Management API is running"
   }
   ```

The server starts listening only after the MongoDB connection succeeds.

## API reference

Base URL: `http://localhost:5000/api/products`

All request bodies must be JSON and use `Content-Type: application/json`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/` | Create a product |
| GET | `/` | List products |
| GET | `/:id` | Get one product by MongoDB ID |
| PUT | `/:id` | Update product fields |
| PATCH | `/:id/stock` | Increase or decrease stock |
| DELETE | `/:id` | Delete a product |
| GET | `/low-stock` | List products at/below reorder level |
| GET | `/summary` | Category-wise inventory summary |

### Create product

`POST /api/products`

```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 48,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```

Required fields: `name`, `sku`, `category`, `price`. `quantity` defaults to `0`, `reorderLevel` defaults to `5`, and `supplier` defaults to `Not specified`.

### List, filter, sort and paginate

`GET /api/products?page=1&limit=10`

Supported query parameters:

| Parameter | Example | Description |
|---|---|---|
| `page` | `page=2` | Page number; defaults to 1 |
| `limit` | `limit=10` | Items per page; defaults to 10, maximum 100 |
| `search` | `search=pen` | Case-insensitive search in name, SKU, category and supplier |
| `category` | `category=Stationery` | Exact, case-insensitive category filter |
| `minPrice` | `minPrice=50` | Minimum price, inclusive |
| `maxPrice` | `maxPrice=500` | Maximum price, inclusive |
| `lowStock` | `lowStock=true` | Only products at/below reorder level |
| `sortBy` | `sortBy=price` | `name`, `sku`, `category`, `price`, `quantity`, `createdAt` or `updatedAt` |
| `order` | `order=asc` | `asc` for ascending; otherwise descending |

Example:

`GET /api/products?category=Stationery&minPrice=50&maxPrice=500&sortBy=price&order=asc&page=1&limit=5`

The response includes `total`, `page`, `limit`, `totalPages`, `count` and `products`.

### Get one product

`GET /api/products/<productId>`

Replace `<productId>` with the `_id` returned when creating/listing a product.

### Update product

`PUT /api/products/<productId>`

Send only the fields to change, for example:

```json
{
  "price": 140,
  "quantity": 60
}
```

Mongoose validators run on updates.

### Adjust stock

`PATCH /api/products/<productId>/stock`

Increase stock:

```json
{
  "change": 10
}
```

Decrease stock:

```json
{
  "change": -5
}
```

`change` must be a non-zero integer. A decrement that would make stock negative is rejected.

### Low-stock report

`GET /api/products/low-stock`

A product is considered low-stock when `quantity` is less than or equal to `reorderLevel`.

### Category summary

`GET /api/products/summary`

Returns category-wise `totalItems`, `totalQuantity`, `totalStockValue` and `avgPrice` using a MongoDB aggregation pipeline.

### Delete product

`DELETE /api/products/<productId>`

## Suggested testing order

1. GET `/` to confirm the server is running.
2. POST `/api/products` to add two or more products.
3. GET `/api/products` and test `search`, `category`, `sortBy`, `order`, `page` and `limit`.
4. GET `/api/products/<productId>`.
5. PUT `/api/products/<productId>` to update product details.
6. PATCH `/api/products/<productId>/stock` with a positive and negative `change`.
7. GET `/api/products/low-stock`.
8. GET `/api/products/summary`.
9. DELETE `/api/products/<productId>`.

## Common issues

- **MongoDB connection failed:** Confirm MongoDB is running and `MONGO_URI` is correct.
- **Port already in use:** Change `PORT` in `.env`, then restart the server.
- **Duplicate SKU:** SKU is unique; choose a different SKU. The API responds with HTTP 409.
- **Validation error:** Check required fields and ensure price, quantity and reorder level are non-negative numbers.
- **Invalid product ID:** Use a valid MongoDB ObjectId from an API response.
- **Invalid JSON:** Ensure the request body is valid JSON and `Content-Type` is `application/json`.

## Notes about the supplied code

The original uploaded TXT is preserved in `docs/original-supplied-code.txt`. The supplied database connection, product model, `package.json` and `server.js` snippets are used unchanged in their corresponding files. The section labelled `routes - product routes -` in the TXT contains a second copy of the product schema/model rather than Express routes. To keep that original code untouched while making the project runnable, the actual Express endpoints have been implemented in `routes/productRoutes.js`. The missing middleware files are also added to satisfy the supplied `server.js` imports and assignment requirements.

## Assignment coverage

This project implements the PDF's listed functional requirements: product schema and validation, create/list/get/update/delete APIs, filtering/sorting/pagination, low-stock report, category-wise aggregation, stock adjustment, centralized error handling and dotenv configuration.
