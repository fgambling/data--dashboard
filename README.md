# AI-Build Data Dashboard

A modern, interactive data visualization dashboard built with Next.js 15, React 19, and TypeScript. Features AI-powered insights, drag-and-drop floating panels, and comprehensive data analysis tools.

## 🚀 Features

- **Interactive Charts**: Click-to-open floating panels with detailed metrics
- **AI Insights**: Google Gemini AI integration for data analysis
- **User Authentication**: Secure registration/login with reference code protection
- **File Upload**: Excel file processing with automatic data parsing
- **Real-time Visualization**: Dynamic charts with product filtering and day selection
- **Drag & Drop Panels**: Custom floating panels with mouse-based dragging
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Charts**: Recharts
- **AI**: Google Generative AI
- **Authentication**: JWT with bcryptjs
- **File Processing**: XLSX parser

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── data/         # Data retrieval endpoints
│   │   ├── datasets/     # Dataset management
│   │   ├── upload/       # File upload handling
│   │   └── ai/           # AI analysis endpoints
│   ├── dashboard/        # Main dashboard page
│   ├── login/           # Authentication pages
│   └── register/
├── components/           # React components
│   ├── DashboardChart.tsx   # Main chart component
│   ├── FloatingPanel.tsx    # Draggable floating panels
│   ├── DatasetManager.tsx   # Dataset selection
│   ├── ProductSelector.tsx  # Product filtering
│   └── FileUpload.tsx       # File upload interface
├── utils/               # Utility functions
│   └── colorUtils.ts    # Color generation utilities
└── lib/                 # Library configurations
    ├── prisma.ts       # Database client
    └── password.ts     # Password hashing
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd data-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push database schema
   npx prisma db push
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # JWT Secret
   JWT_SECRET="your-secret-key"

   # Google AI API Key
   GEMINI_API_KEY="your-api-key"
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

The application uses a reference code system for registration security:

- **Reference Code**: `aibuild` (case-insensitive)
- Register at `/register` with the reference code
- Login at `/login` after registration

## 📊 Usage

1. **Upload Data**: Use the upload button to import Excel files
2. **Select Dataset**: Choose from available datasets in the dropdown
3. **Filter Products**: Select specific products to visualize
4. **Click Charts**: Click on chart data points to open detailed floating panels
5. **AI Analysis**: Get AI-powered insights about your data

## 🎨 Key Components

### DashboardChart

- Interactive line charts with Recharts
- Click-to-open floating panels
- Product and day filtering
- Real-time data visualization

### FloatingPanel

- Custom draggable panels (React 19 compatible)
- Detailed metric display
- Portal-based rendering to avoid clipping
- Keyboard and mouse controls

### File Upload

- Excel file processing with XLSX
- Automatic data parsing and validation
- Progress feedback and error handling

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with Next.js configuration
- **Prettier**: Code formatting (recommended)

### Database Schema

The application uses SQLite with the following main entities:

- **Users**: Authentication and user management
- **Datasets**: Data collection containers
- **DataRecords**: Individual data entries with metrics

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is private and proprietary.



---

Built with ❤️ using Next.js, React, and TypeScript
