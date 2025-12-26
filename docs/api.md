# API Documentation

The Kal API provides access to Malaysian food nutritional data. All API endpoints require authentication via API key.

**🌐 Production API Base URL:** `https://kalori-api.my/api`

---

## Authentication

All API requests require an API key to be passed in the `x-api-key` header.

```bash
curl -H "x-api-key: YOUR_API_KEY" https://kalori-api.my/api/foods
```

### Getting an API Key

1. Sign in at [https://kalori-api.my](https://kalori-api.my)
2. Navigate to the Dashboard
3. Generate a new API key

---

## Natural Foods Endpoints

### Search Foods

Search natural foods by name.

```
GET /api/foods/search
```

**Query Parameters:**

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| `q`       | string | ✅ Yes   | Search query (e.g., "nasi lemak") |

**Example Request:**

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://kalori-api.my/api/foods/search?q=nasi"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "6789abc123def456",
      "name": "Nasi Lemak",
      "calories": 450,
      "protein": 12,
      "carbs": 55,
      "fat": 20,
      "serving": "1 plate",
      "category": "Rice"
    }
  ],
  "count": 1
}
```

---

### List Foods

Get all natural foods with optional filtering and pagination.

```
GET /api/foods
```

**Query Parameters:**

| Parameter  | Type    | Required | Description                         |
| ---------- | ------- | -------- | ----------------------------------- |
| `category` | string  | No       | Filter by category (e.g., "Rice")   |
| `limit`    | integer | No       | Max results (default: 50, max: 200) |
| `offset`   | integer | No       | Pagination offset (default: 0)      |

**Example Request:**

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://kalori-api.my/api/foods?category=Rice&limit=10"
```

**Example Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Get Food by ID

Get a single natural food item by its ID.

```
GET /api/foods/:id
```

**Path Parameters:**

| Parameter | Type   | Description      |
| --------- | ------ | ---------------- |
| `id`      | string | MongoDB ObjectId |

**Example Request:**

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://kalori-api.my/api/foods/6789abc123def456"
```

---

### List Categories

Get all available food categories.

```
GET /api/categories
```

**Example Request:**

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://kalori-api.my/api/categories"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    "Basics",
    "Desserts",
    "Drinks",
    "Meat",
    "Noodles",
    "Rice",
    "Seafood",
    "Snacks",
    "Soups",
    "Vegetables"
  ]
}
```

---

## Halal Foods Endpoints

### Search Halal Foods

Search halal-certified foods by name.

```
GET /api/halal/search
```

**Query Parameters:**

| Parameter | Type   | Required | Description  |
| --------- | ------ | -------- | ------------ |
| `q`       | string | ✅ Yes   | Search query |

**Example Request:**

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://kalori-api.my/api/halal/search?q=chicken"
```

---

### List Halal Foods

Get all halal foods with optional filtering and pagination.

```
GET /api/halal
```

**Query Parameters:**

| Parameter  | Type    | Required | Description                         |
| ---------- | ------- | -------- | ----------------------------------- |
| `brand`    | string  | No       | Filter by brand                     |
| `category` | string  | No       | Filter by category                  |
| `limit`    | integer | No       | Max results (default: 50, max: 200) |
| `offset`   | integer | No       | Pagination offset (default: 0)      |

---

### Get Halal Food by ID

```
GET /api/halal/:id
```

---

### List Halal Brands

Get all halal food brands.

```
GET /api/halal/brands
```

**Example Response:**

```json
{
  "success": true,
  "data": ["Brand A", "Brand B", "Brand C"]
}
```

---

## Stats Endpoint

### Get Database Statistics

Get overall database statistics including food counts and categories.

```
GET /api/stats
```

**Example Request:**

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://kalori-api.my/api/stats"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "naturalFoods": {
      "total": 100,
      "categories": ["Rice", "Noodles", "Meat", ...]
    },
    "halalFoods": {
      "total": 50,
      "brands": ["Brand A", "Brand B", ...]
    }
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common HTTP Status Codes

| Status | Description                    |
| ------ | ------------------------------ |
| 200    | Success                        |
| 400    | Bad request (invalid params)   |
| 401    | Unauthorized (invalid API key) |
| 404    | Resource not found             |
| 429    | Too many requests (rate limit) |
| 500    | Internal server error          |

---

## Rate Limits

API requests are rate-limited per API key:

- **Free tier:** 100 requests/day
- **Premium tier:** 10,000 requests/day

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703548800
```

---

## Data Types

### Food Object

```typescript
interface Food {
  id: string; // MongoDB ObjectId
  name: string; // Food name
  calories: number; // kcal per serving
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  serving: string; // Serving size (e.g., "1 plate")
  category: string; // Category name
}
```

### Halal Food Object

```typescript
interface HalalFood extends Food {
  brand: string; // Brand name
  halalCertifier: string; // Halal certification body
  halalCertYear: number; // Year of certification
}
```

---

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at:

```
https://kalori-api.my/openapi.json
```

---

## Support

For API support, please open an issue on [GitHub](https://github.com/Zen0space/Kal-Monorepo/issues).
