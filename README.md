# CraveDash Backend

Simple Spring Boot REST API and React frontend for the CraveDash food-order demo. Orders and status history use Spring Data Redis; Amazon MemoryDB is used when configured, while local development defaults to the Redis container at `localhost:6379`.

## Requirements

- Java 17+
- Maven 3.9+
- Amazon MemoryDB with TLS enabled, or a local Redis instance for development

## Run the frontend

The React/Vite frontend is maintained separately in `frontend/` and connects to the Spring Boot API at `http://localhost:8080`.
Start the backend and local Redis first, then open a second PowerShell terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend reads live order and health data from the backend; it does not store orders locally.

## Sign-in and data storage

Customer accounts are created from the frontend registration page. The owner account is bootstrapped from backend environment variables. Customer passwords are stored only as BCrypt hashes in Redis; plaintext passwords are not saved. Login sessions use random, HttpOnly cookies with an eight-hour lifetime, and session records are also stored in Redis.

PowerShell, for local development:

```powershell
$env:CRAVEDASH_AUTH_USERNAME = "admin"
$env:CRAVEDASH_AUTH_PASSWORD = "choose-a-strong-password"
$env:CRAVEDASH_FRONTEND_ORIGIN = "http://localhost:5173"
mvn spring-boot:run
```

Use the configured owner username and password on `/login`. Customers can use `/register` to create their own accounts and are signed in automatically. Keep owner credentials out of source control. For HTTPS deployments, set `CRAVEDASH_SECURE_COOKIE=true` and configure `CRAVEDASH_FRONTEND_ORIGIN` to the frontend's exact origin.

Customers can create orders and see only their own orders and status history. The owner can see all customer orders and advance each order through the status flow. Existing orders without an account owner remain visible to the owner, not to customer accounts.

The owner account is created lazily on first owner login. If owner credentials change after that account has been created, remove its `auth:user:{username}` entry from Redis before restarting so the new environment password can be bootstrapped.

## Configure MemoryDB

PowerShell:

```powershell
$env:MEMORYDB_HOST = "clustercfg.example.memorydb.us-east-1.amazonaws.com"
$env:MEMORYDB_PORT = "6379"
$env:MEMORYDB_PASSWORD = "your-secret"
$env:MEMORYDB_SSL = "true"
$env:CRAVEDASH_AUTH_USERNAME = "admin"
$env:CRAVEDASH_AUTH_PASSWORD = "choose-a-strong-password"
$env:CRAVEDASH_SECURE_COOKIE = "true"
$env:CRAVEDASH_FRONTEND_ORIGIN = "https://your-frontend.example.com"
mvn spring-boot:run
```

`MEMORYDB_HOST` must be the cluster's configuration endpoint, not the frontend URL. Use the same VPC/network access, security group rules, and MemoryDB ACL/user configuration required by your cluster. Do not commit passwords or AWS credentials. A local Redis container at `localhost:6379` is not Amazon MemoryDB; it is only the local development store.

For local Redis, only the Redis defaults are needed (set the CraveDash login variables as shown above):

```powershell
mvn spring-boot:run
```

Defaults are `localhost:6379`, no Redis password, and no TLS. The application starts even when Redis is temporarily unavailable; `GET /api/health` reports `DISCONNECTED` until the connection works.

## APIs

Base URL: `http://localhost:8080`

Sign-in endpoints:

- `POST /api/auth/register` accepts a unique customer username and password, stores a BCrypt hash, and sets an HttpOnly session cookie.
- `POST /api/auth/login` accepts `{"username":"admin","password":"..."}` and sets an HttpOnly session cookie.
- `GET /api/auth/me` returns the current session user and role.
- `POST /api/auth/logout` deletes the session from Redis and clears the cookie.

All `/api/orders` endpoints require a valid session cookie. Customers can access only orders belonging to their account; only the owner can update order statuses, and each update must move to the next status. `GET /api/health` remains public. The health endpoint confirms that the configured Redis-compatible store responds to a ping; with defaults, that is the local Redis container, not Amazon MemoryDB. It reports `storageTarget: "LOCAL_REDIS"` for the default host and `storageTarget: "CONFIGURED_REDIS_ENDPOINT"` when `MEMORYDB_HOST` is set to a remote endpoint.

Opening the base URL returns the service name and links to the health and orders APIs.

Create an order:

```http
POST /api/orders
Content-Type: application/json

{
  "userName": "the logged-in customer username",
  "restaurant": "Pizza House",
  "amount": 799
}
```

Get one order:

```http
GET /api/orders/5001
```

Get all orders:

```http
GET /api/orders
```

Update status:

```http
PUT /api/orders/5001/status
Content-Type: application/json

{
  "status": "PREPARING"
}
```

Valid statuses are `PLACED`, `ACCEPTED`, `PREPARING`, `OUT_FOR_DELIVERY`, and `DELIVERED`.

Get status history:

```http
GET /api/orders/5001/history
```

Check the MemoryDB connection:

```http
GET /api/health
```

A connected response is:

```json
{
  "status": "UP",
  "memoryDB": "CONNECTED",
  "storageTarget": "LOCAL_REDIS"
}
```

Missing orders return `404` with `{"message":"Order not found"}`. Invalid JSON, validation, or status values return `400`.

## Demo data

On first startup, the service creates orders `5001` and `5002` only when those IDs do not already exist. Existing MemoryDB data is never overwritten.

## Storage keys

- `auth:user:{username}` stores the account role and BCrypt password hash.
- `auth:session:{token}` stores the username for an expiring login session.
- `order:{orderId}` stores the order JSON.
- `order:{orderId}:history` stores status history in a Redis list.
- `orders:ids` indexes known order IDs.
- `orders:id-sequence` generates new order IDs starting at `5001`.

Orders also store the customer account username so customer list and detail requests can be authorized server-side.
