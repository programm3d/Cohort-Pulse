# Cohort Pulse

Cohort Pulse is a comprehensive web application designed to help mentors and administrators manage, track, and support cohorts of interns or students through their learning journey. 

It provides tools for tracking daily mood and check-ins, monitoring weekly pulses (energy and confidence), surfacing critical blockers, tracking milestone completion, and providing actionable insights for cohort administrators.

## Features

### 🧑‍🎓 For Interns
- **Daily Check-ins**: Submit daily mood and check-in statuses within a specific time window.
- **Weekly Pulse**: A more comprehensive weekly review of energy levels, confidence, completions, blockers, and open-ended feedback (available on Sundays).
- **Milestone Tracking**: View assigned milestones, mark them as complete, or report specific blockers if stuck.
- **Join Cohorts**: Easily join a new cohort using a Cohort ID.
- **Blocker Board & Win Wall**: See team progress and share shoutouts with peers.

### 👨‍🏫 For Admins / Mentors
- **Cohort Dashboard**: A bird's-eye view of cohort health, average mood, average energy, and milestone completion rates. Contains interactive charts for trend analysis.
- **Risk Radar**: Automatically surfaces interns who are struggling (e.g., missed multiple check-ins or have a consecutively declining daily mood score). 
- **Blocker Heatmap**: Aggregates common blockers so mentors can address widespread technical or conceptual hurdles all at once.
- **Anonymous Insights**: Groups open-ended feedback from weekly pulses and anonymous blockers into key themes (e.g., "Workload & Stress", "Clarity & Expectations") without revealing intern identities.
- **Milestone Management**: Create and track milestones with deadlines for specific cohorts.
- **Missed Check-ins Tracker**: See exactly who missed their daily check-in, weekly pulse, or milestone deadlines.

## Technology Stack

### Frontend (`/client`)
- **React.js** with **TypeScript**
- **Vite** for fast, modern builds.
- **Tailwind CSS** for styling.
- **Recharts** for interactive data visualization graphs.
- **Lucide React** for icons.
- **React Router** for navigation.

### Backend (`/server`)
- **Node.js** & **Express** with **TypeScript**
- **MongoDB** & **Mongoose** for database management.
- **JWT** (JSON Web Tokens) for authentication.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB running locally or a MongoDB Atlas connection string.

### Setup Instructions

1. **Clone the repository** (if you haven't already).
2. **Install dependencies**:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```
3. **Configure Environment Variables**:
   - Create a `.env` file in the `/server` directory:
     ```env
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     ```
   - Create a `.env` file in the `/client` directory:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```

### Running the Application (Development)

1. **Start the Backend**:
   ```bash
   cd server
   npm run dev
   ```
2. **Start the Frontend**:
   ```bash
   cd client
   npm run dev
   ```
3. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Building for Production

To build the client for production deployment:
```bash
cd client
npm run build
```
This will compile the React code and output the static assets to the `client/dist` directory.

To build the backend:
```bash
cd server
npx tsc -b
```
This will compile the TypeScript code to JavaScript.
