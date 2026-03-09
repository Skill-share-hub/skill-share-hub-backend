# SkillShareHub — Backend

REST API for the SkillShareHub peer-to-peer skill sharing platform.

## Tech Stack

- **Express 5** · **TypeScript** · **MongoDB** · **Redis** · **JWT** · **Zod** · **Nodemailer**

## Setup

```bash
npm install
cp .env.example .env   # fill in values
npm run dev             # http://localhost:5000
```

## Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Access token secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `CLIENT_URL` | Frontend URL for CORS |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection |
| `MAIL_HOST` / `MAIL_USER` / `MAIL_PASS` | SMTP email config |

## API Routes

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Send OTP to email |
| `POST` | `/api/auth/register` | Register with OTP |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/users/profile` | Get user profile |
| `PUT` | `/api/users/profile` | Update user profile |

| Method | Endpoint | Description | Payload | Params | Query |
|---|---|---|---|---|---|
| `GET` | `/api/courses` | Get all courses | - | - | `q(search)`, `limit(items)`, `page(page number)`, `c(category)`, `type(credit/paid)`, `sort(latest/popular)`, `recommended(true/false)` |
| `GET` | `/api/courses/:id` | Get single course | - | `id` | - |
| `POST` | `/api/courses` | Create course | `title`, `description`, `price`, `category`, `contentModules[]`, `courseType`, `courseSkills[]`, `creditCost`, `status`, `courseLevel`, `thumbnailUrl(file)` | - | - |
| `PUT` | `/api/courses/:id` | Update course | Same fields as create but **optional** | `id` | - |
| `PATCH` | `/api/courses/:id` | Change course status | `status` | `id` | - |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Production server |
