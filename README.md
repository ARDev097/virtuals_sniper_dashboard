# Genesis Dapp - Crypto Analytics Dashboard

A comprehensive full-stack crypto analytics dashboard for detecting snipers and analyzing token transactions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB instance (optional - works with demo data)
- npm or yarn

### Installation & Setup

1. **Clone and install dependencies**
\`\`\`bash
git clone <repository-url>
cd genesis-dapp
npm install
\`\`\`

2. **Environment Setup**
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your MongoDB connection string
\`\`\`

3. **Start the backend server**
\`\`\`bash
npm run server
\`\`\`

4. **Start the frontend (in a new terminal)**
\`\`\`bash
npm run dev
\`\`\`

5. **Open your browser**
\`\`\`
http://localhost:3000
\`\`\`

## 🎯 Features

### 🏠 **Home Dashboard**
- Token grid with search and filtering
- Launch date and token information
- Real-time stats and KPIs
- Direct links to detailed token analysis

### 📊 **Token Details Page**
- **Transactions Tab**: Complete transaction history with interactive charts
- **Sniper Insights Tab**: Advanced sniper detection with PnL analysis
- **Other Tab**: Placeholder for future features

### 🎯 **Global Snipers Page**
- Cross-token sniper analysis
- Profit distribution charts
- Top performers identification
- Comprehensive filtering and search

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Recharts** for data visualization
- **Collapsible Sidebar** layout

### Backend
- **Node.js** with Express.js
- **MongoDB** for data storage
- **Advanced sniper detection algorithms**
- **CORS** enabled for cross-origin requests

## 📊 API Endpoints

- `GET /api/tokens` - Get all tokens
- `GET /api/token/:symbol` - Get token details and stats
- `GET /api/token/:symbol/swaps` - Get token swap transactions
- `GET /api/token/:symbol/snipers` - Get token sniper analysis
- `GET /api/global-snipers` - Get global sniper analysis

## 🔍 Sniper Detection Algorithm

The system identifies potential snipers based on:

1. **Timing Criteria**: Buy within 10-minute chunks of launch
2. **Volume Criteria**: Purchase over 100,000 tokens
3. **Gas Criteria**: High gas usage (> 0.000002 ETH)
4. **Block Criteria**: Buy within 100 blocks of launch
5. **PnL Calculation**: FIFO matching with realized/unrealized profits

## 🎨 UI Features

- **Professional Design**: Clean, modern interface with Tailwind CSS
- **Responsive Layout**: Works on desktop and mobile devices
- **Interactive Charts**: Bar charts, line charts, and data visualizations
- **Real-time Data**: Live updates from MongoDB or demo data
- **Advanced Filtering**: Search, sort, and filter across all data
- **Loading States**: Smooth loading animations and skeleton screens

## 🚀 Deployment

### Frontend (Vercel)
\`\`\`bash
npm run build
vercel --prod
\`\`\`

### Backend (Any Node.js hosting)
\`\`\`bash
npm run server
\`\`\`

## 📝 Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run server` - Start Express backend server
- `npm run dev:server` - Start backend with auto-reload
- `npm run build` - Build for production
- `npm run start` - Start production server

## 🔧 Configuration

The app works in two modes:

1. **With MongoDB**: Connect to real database with environment variables
2. **Demo Mode**: Uses mock data when database is not available

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
