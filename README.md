# 🏋️‍♂️ Gym Workout Tracker Web Application

A modern, responsive, full-stack **Gym Workout Tracker** built with **Vue 3, Element Plus, Pinia, Vercel Serverless Functions, and MongoDB Atlas**.

The backend operates entirely via **Vercel Serverless Functions inside the same project** under the `/api` directory. No separate backend server, VPS, or continuous Express process is required!

---

## 🌟 Main Features

- 🔐 **Real Authentication**: User registration, login, logout, and password hashing with `bcryptjs` using secure HTTP-only cookies.
- 📐 **First-Login Measurement Setup**: Welcome popup prompting for starting weight, waist, and neck measurements.
- 🌿 **Automatic Rest-Day Assignment**: Automatically backfills missing records for yesterday with a Rest Day entry in the user's timezone.
- 💪 **Weekly Monday Progress Check-in**: Automated check-in popup every Monday to track weekly body measurements.
- 🏋️ **Workout & Rest Day Management**: Log workouts with custom exercise sets, reps, weight (kg), notes, or rest days with confirmation warnings.
- 📅 **Interactive Calendar View**: Month calendar with color-coded day types (Green for Workouts, Gray for Rest Days).
- 📈 **Exercise Progress Tracker**: Searchable exercise selector, personal records (PR max weight, total volume), SVG progress trend charts, and set-by-set breakdown.
- 📏 **Body Measurements Dashboard**: Individual tracking cards for Weight, Waist, and Neck with start value, current value, total change, and history tables.
- 📱 **Modern & Responsive UI**: Clean fitness dashboard design, dark sidebar, mobile drawer, color-coded workout groups, and Element Plus components.

---

## 🛠️ Technology Stack

- **Frontend**: Vue 3 (Composition API), Vite, Element Plus, Pinia, Vue Router, Element Plus Icons
- **Backend API**: Vercel Serverless Functions (Node.js runtime)
- **Database**: MongoDB Atlas (`gym_tracker`)
- **Security**: `bcryptjs` password hashing, HTTP-only session cookies, server-side session validation

---

## 📁 Project Architecture

```text
gym-tracker/
├── api/                             # Vercel Serverless Functions
│   ├── _lib/                        # Shared serverless helpers
│   │   ├── mongodb.js               # Reusable MongoDB cached connection helper
│   │   └── auth.js                  # Session cookie & token authentication
│   ├── auth/                        # Registration, Login, Logout, Me endpoints
│   ├── workouts/                    # GET, POST, PATCH, DELETE workouts
│   ├── measurements/                # Body measurements CRUD
│   ├── progress/exercise/           # Per-exercise lift progress & PR statistics
│   ├── exercises/                   # Exercises catalog
│   ├── workout-groups/              # Preloaded workout groups
│   └── checkins/                    # Weekly Monday check-in endpoints
├── src/                             # Vue 3 Frontend SPA
│   ├── assets/                      # Global styles & CSS design tokens
│   ├── components/                  # Reusable Vue components
│   ├── views/                       # Vue Router view screens
│   ├── stores/                      # Pinia state management stores
│   ├── services/                    # API request services
│   ├── router/                      # Navigation guards & routes
│   └── utils/                       # Date & validation helpers
├── scripts/
│   └── seed.js                      # Database seed script for MongoDB Atlas
├── vercel.json                      # Vercel SPA rewrites & serverless configuration
├── vite.config.js                   # Vite config with local Vercel API runner
└── .env.example                     # Environment variables schema
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=gym_tracker
SESSION_SECRET=a_long_random_secret_string_min_32_chars
```

> [!IMPORTANT]
> - Never prefix credentials with `VITE_` or expose `MONGODB_URI` / `SESSION_SECRET` to the frontend bundle.
> - Serverless API routes in `/api` access these variables securely.

---

## 💻 Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Seed Database (Preload Exercises & Groups)

Ensure `MONGODB_URI` in `.env` points to your MongoDB Atlas cluster:

```bash
npm run seed
```

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

> Note: `vite.config.js` includes a local API runner that automatically handles `/api/*` serverless requests during development.

---

## 🚀 Production Deployment on Vercel

The application is designed to be deployed as **a single unified Vercel project**.

### Step-by-Step Deployment Instructions:

1. **Create GitHub Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Gym Workout Tracker"
   git remote add origin https://github.com/your-username/gym-tracker.git
   git branch -M main
   git push -u origin main
   ```

2. **MongoDB Atlas Network Access**:
   - Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
   - Go to **Network Access** → **Add IP Address**.
   - Select **Allow Access from Anywhere (`0.0.0.0/0`)** to allow Vercel Serverless Functions to connect.

3. **Import into Vercel**:
   - Log in to [Vercel](https://vercel.com).
   - Click **Add New** → **Project**.
   - Import your GitHub repository (`gym-tracker`).

4. **Configure Environment Variables in Vercel**:
   In the **Environment Variables** section, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `MONGODB_DB_NAME`: `gym_tracker`
   - `SESSION_SECRET`: A long random secret string.

5. **Deploy**:
   - Click **Deploy**.
   - Vercel will automatically build the Vue 3 frontend and deploy the Node.js `/api` serverless functions.

6. **Redeploying Changes**:
   - Any push to your GitHub `main` branch will automatically trigger a Vercel build and redeployment.

---

## 🧪 Verification & Testing Checklist

- [x] User Registration & Email uniqueness check
- [x] Login with password validation & secure HTTP-only cookies
- [x] First-login initial body measurements popup
- [x] Yesterday Rest-Day automatic creation
- [x] Weekly Monday Check-in popup prompt
- [x] Create/edit workout logs & sets
- [x] Calendar overview with color-coded day types
- [x] Exercise progress tracker with PR stats and SVG chart
- [x] Weight, waist, and neck measurement histories
