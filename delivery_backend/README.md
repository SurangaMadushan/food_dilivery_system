# Delivery Backend

Standalone delivery backend for the group project. This service provides a dedicated login for delivery staff, delivery menu endpoints, and delivery confirmation management for admins.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and adjust values:

```bash
cp .env.example .env
```

3. Ensure MongoDB is running and update `MONGODB_URI` in `.env`.

4. Seed the admin user (uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`):

```bash
npm run seed:admin
```

5. Start the API:

```bash
npm run dev
```


The API will run on `http://localhost:8081` by default.


## API Endpoints

- `POST /api/auth/register` (delivery staff registration)
- `POST /api/auth/login` (delivery staff/admin login)
- `GET /api/deliveries/menu` (public delivery menu)
- `POST /api/deliveries/confirm` (delivery staff confirms delivery)
- `GET /api/admin/confirmations` (admin views confirmations)
