# 📦 Shipping Dashboard - نظام إدارة الشحن

A comprehensive full-stack shipping management system with AI-powered assistance, built with React, TypeScript, Node.js, and MongoDB.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)

## ✨ Features

### 🤖 AI-Powered Assistant

- **Intelligent Chat Interface** with bilingual support (Arabic/English)
- **Voice Input** using Web Speech API
- **Document Analysis** (PDF, CSV, Images) using Tesseract.js and PDF parsing
- **RAG (Retrieval-Augmented Generation)** with ChromaDB vector database
- **Visual Analytics** with dynamic chart generation
- **Session Management** with chat history and persistence
- **Real-time Streaming** responses from Google Gemini AI

### 👥 Multi-Role Dashboard System

- **Admin Dashboard**
  - Complete system overview with real-time statistics
  - Order analytics and profit tracking
  - User management and driver assignment
  - Export functionality (PDF/CSV reports)
- **Merchant Dashboard**
  - Personalized order tracking
  - Revenue analytics
  - Order creation and management
- **Employee Dashboard**
  - Order processing workflow
  - Driver assignment interface
  - Status update capabilities

### 📋 Order Management

- **Complete CRUD Operations** for orders
- **Advanced Filtering** by status, date, search query
- **Server-side Pagination** for performance
- **Status Workflow Management** with role-based permissions
- **Driver Assignment** with city-based availability
- **Real-time Updates** with optimistic UI updates
- **Bulk Export** to Excel/CSV

### 🚚 Driver Management

- **Driver Profiles** with contact information
- **City Assignment** system with governorate support
- **Availability Toggle** for real-time status
- **Performance Tracking**
- **Delivery History**

### 📊 Analytics & Reporting

- **Interactive Charts** using Recharts
- **Real-time Statistics** cards
- **Profit Tracking** (delivered vs pending)
- **Order Trends** visualization (7-day rolling)
- **Export Reports** in multiple formats

### 🔐 Authentication & Authorization

- **JWT-based Authentication**
- **Role-based Access Control** (Admin, Merchant, Employee)
- **Secure Password Hashing** with bcrypt
- **Cookie-based Session Management**

### 🎨 Modern UI/UX

- **Responsive Design** with Tailwind CSS
- **Dark/Light Mode** support
- **Arabic RTL** layout support
- **Radix UI Components** for accessibility
- **Lucide Icons** for consistent iconography
- **Toast Notifications** with Sonner
- **Loading States** and skeleton screens

## 🛠️ Technology Stack

### Frontend

- **Framework**: React 19.1 with TypeScript
- **Build Tool**: Vite (Rolldown)
- **Styling**: Tailwind CSS 4.1
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: Zustand (implied from patterns)
- **Routing**: React Router DOM 7.9
- **Charts**: Recharts 3.2
- **HTTP Client**: Axios
- **Form Validation**: Custom validators
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js 4.22
- **Database**: MongoDB with Mongoose 8.20
- **Authentication**: JWT + bcryptjs
- **AI Integration**:
  - Google Generative AI (Gemini)
  - LangChain for orchestration
  - ChromaDB for vector storage
- **File Processing**:
  - Multer for uploads
  - PDF-parse for PDF extraction
  - Tesseract.js for OCR
  - CSV-parser for CSV files
- **Security**: CORS, Cookie-parser, Validator

### Development Tools

- **TypeScript**: 5.9
- **ESLint**: 9.36 with React plugins
- **Nodemon**: For development server
- **Git**: Version control

## 📁 Project Structure

```
shipping-dashboard/
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboards/  # Role-specific dashboards
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── MerchantDashboard.tsx
│   │   │   │   └── EmplyeeDashboard.tsx
│   │   │   ├── page/        # Feature pages
│   │   │   │   ├── OrderManagement.tsx
│   │   │   │   ├── DriverManagement.tsx
│   │   │   │   ├── AiMode.tsx
│   │   │   │   ├── AddUser.tsx
│   │   │   │   └── ...
│   │   │   └── ui/          # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and helpers
│   │   ├── types/           # TypeScript type definitions
│   │   └── constants/       # App constants
│   └── package.json
│
├── server/                  # Backend Node.js application
│   ├── models/              # Mongoose schemas
│   │   ├── Order.js
│   │   ├── User.js
│   │   ├── City.js
│   │   ├── Governotate.js
│   │   └── ...
│   ├── routes/              # API routes
│   │   ├── aiRouter.js      # AI assistant endpoints
│   │   ├── orderRoutes.js
│   │   ├── userRoutes.js
│   │   └── ...
│   ├── middleware/          # Express middleware
│   ├── scripts/             # Utility scripts
│   ├── uploads/             # File upload directory
│   └── server.js            # Entry point
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd shipping-dashboard
   ```

2. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd ../client
   npm install
   ```

4. **Environment Configuration**

   Create `.env` file in the `server` directory:

   ```env
   # Server Configuration
   PORT=5000

   # Database
   MONGODB_URI=mongodb://localhost:27017/shipping_dashboard

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key_here

   # Google AI
   API_KEY=your_google_gemini_api_key

   # ChromaDB (optional, defaults to localhost)
   CHROMA_URL=http://localhost:8000
   ```

   Create `.env` file in the `client` directory:

   ```env
   VITE_API_URL=http://localhost:5000
   ```

5. **Start ChromaDB (for AI features)**

   ```bash
   # Using Docker
   docker run -p 8000:8000 chromadb/chroma

   # Or install locally
   pip install chromadb
   chroma run --host localhost --port 8000
   ```

### Running the Application

1. **Start the backend server**

   ```bash
   cd server
   npm start
   # or for development with auto-reload
   npm run dev
   ```

2. **Start the frontend development server**

   ```bash
   cd client
   npm run dev
   ```

3. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## 📖 Usage

### Default User Roles

The system supports three user roles:

1. **Admin** - Full system access
2. **Merchant** - Order creation and tracking
3. **Employee** - Order processing and driver assignment

### Key Workflows

#### Creating an Order

1. Navigate to Order Management
2. Click "Create New Order"
3. Fill in customer details, destination, and shipping type
4. Submit to create order

#### Assigning a Driver

1. Open order details
2. Click "Assign Driver"
3. Select from available drivers for the destination city
4. Confirm assignment

#### Using AI Assistant

1. Click the AI button in the navigation
2. Type your question or upload a document
3. Use voice input for hands-free interaction
4. View analytics and charts generated by AI

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Orders

- `GET /api/orders` - Get all orders (with pagination)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `PATCH /api/orders/:id/status` - Update order status
- `PATCH /api/orders/:id/assign-driver` - Assign driver

### Drivers

- `GET /api/drivers/all` - Get all drivers
- `GET /api/drivers/by-city` - Get drivers by city
- `PATCH /api/drivers/:id/availability` - Toggle availability
- `POST /api/drivers/:id/assign-cities` - Assign cities

### AI Assistant

- `POST /api/ai/chat` - Send message to AI
- `POST /api/ai/upload` - Upload document for analysis

## 🎯 Features in Detail

### AI Assistant Capabilities

- **Natural Language Processing**: Understands Arabic and English queries
- **Document Intelligence**: Extracts and analyzes text from PDFs, images, and CSV files
- **Context-Aware Responses**: Uses RAG to provide accurate answers based on uploaded documents
- **Visual Analytics**: Generates charts and graphs from data
- **Session Persistence**: Maintains conversation history across sessions

### Order Status Workflow

```
Pending → Processing → On the Way → Delivered
                    ↓
                Cancelled
```

### Role Permissions

| Feature         | Admin | Merchant | Employee |
| --------------- | ----- | -------- | -------- |
| View All Orders | ✅    | ❌       | ✅       |
| Create Orders   | ✅    | ✅       | ✅       |
| Assign Drivers  | ✅    | ❌       | ✅       |
| Manage Users    | ✅    | ❌       | ❌       |
| View Analytics  | ✅    | ✅ (own) | ✅       |
| Export Reports  | ✅    | ✅ (own) | ✅       |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide](https://lucide.dev/)
- **AI**: [Google Gemini](https://ai.google.dev/)
- **Vector DB**: [ChromaDB](https://www.trychroma.com/)
- **Charts**: [Recharts](https://recharts.org/)

## 📧 Support

For support, email your-email@example.com or open an issue in the repository.

---

Made with ❤️ for efficient shipping management
