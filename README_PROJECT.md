# 📦 ShipFlow - نظام إدارة الشحن الذكي

## Project Team

- **Ahmed Magdy Hussin**
- **Ruba Ismail Mahmoud**
- **Sefin Kameil Zaky**
- **Ahmed Ibrahim Zidan**
- **Ahmed Olwy Ali**
- **Youssef Shaban Saleh**

---

## Project Idea

**ShipFlow** is an innovative digital platform designed to revolutionize the shipping and delivery management experience in Egypt. The platform addresses the common challenges faced by both merchants and shipping companies by providing a centralized, easy-to-use system for managing orders, tracking deliveries, and analyzing business performance.

### The Problem:

- Traditional shipping management methods are fragmented and time-consuming
- Merchants struggle to track their orders and monitor delivery status
- Shipping companies lack efficient tools to manage drivers and track deliveries
- No transparent pricing or real-time tracking information
- Manual data entry leads to errors and delays

### Our Solution:

**ShipFlow** brings together merchants, employees, and drivers on a single platform, offering:

**For Merchants:**

- Seamless order creation with automatic cost calculation
- Real-time order tracking and status updates
- Revenue analytics and order history
- Export functionality for business reports

**For Employees:**

- Comprehensive dashboard to process orders
- Driver assignment with city-based availability
- Order status management workflow
- Quick search and filtering capabilities

**For Admins:**

- Complete system overview with real-time statistics
- User management and role-based access control
- Regional management (governorates, cities, shipping fees)
- AI-powered assistant for data analysis

**For Everyone:**

- Modern, responsive Arabic RTL interface
- Dark/Light mode support
- Export reports to PDF/CSV/Excel
- Real-time notifications

### What Sets ShipFlow Apart:

Our **AI Assistant** powered by Google Gemini - a conversational AI that understands Arabic and English, allowing users to analyze data, generate reports, and get insights simply by chatting, making data analysis feel natural and effortless.

---

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)]()
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)]()
[![Google AI](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?logo=google)]()

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Frontend Setup](#-frontend-setup)
- [Backend Setup](#-backend-setup)
- [AI Assistant](#-ai-assistant)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)

---

## 🎯 Overview

ShipFlow is a modern shipping management platform that streamlines the entire delivery workflow:

1. **Frontend Application** - React-based user interface with TypeScript and Vite
2. **Backend API** - Express.js-powered REST API with MongoDB
3. **AI Assistant** - Intelligent conversational analytics using Google Gemini

---

## ✨ Features

### Core Platform Features

**🔐 Authentication & Authorization**

- Secure signup/login using JWT and Bcrypt
- Role-Based Access Control (RBAC): Admin, Employee, Merchant, and Courier roles
- Cookie-based session management

**📦 Order Management**

- Complete CRUD operations for orders
- Advanced filtering by status, date, search query
- Server-side pagination for performance
- Status workflow management with role-based permissions
- Bulk export to Excel/CSV/PDF

**🚚 Driver Management**

- Driver profiles with contact information
- City assignment system with governorate support
- Availability toggle for real-time status
- Delivery history and performance tracking

**🗺️ Regional Management**

- Governorate and city management
- Dynamic shipping fee configuration
- Village delivery cost settings
- Shipping type management (Standard, Express, 24-hour)

**💰 Cost Calculation**

- Automatic shipping cost calculation
- Weight-based pricing system
- Extra weight cost per kg
- Village delivery surcharge

**📊 Dashboard & Analytics**

- Real-time statistics cards
- Interactive charts using Recharts
- Order trends visualization (7-day rolling)
- Profit tracking (delivered vs pending)
- Export reports in multiple formats

### AI Assistant Features

**🤖 Natural Language Processing** - Understands Arabic and English queries

**📄 Document Analysis** - PDF, CSV, and Image processing

**📈 Visual Analytics** - Dynamic chart generation

**🔍 RAG System** - Context-aware responses using ChromaDB

**🎙️ Voice Input** - Hands-free interaction with Web Speech API

**💬 Session Persistence** - Chat history across sessions

---

## 🛠 Tech Stack

### Frontend

| Technology       | Version | Purpose               |
| ---------------- | ------- | --------------------- |
| **React**        | 19.1    | UI Framework          |
| **TypeScript**   | 5.9     | Type Safety           |
| **Vite**         | Latest  | Build Tool            |
| **Tailwind CSS** | 4.1     | Styling               |
| **Radix UI**     | Latest  | Accessible Components |
| **shadcn/ui**    | Latest  | UI Component Library  |
| **React Router** | 7.9     | Navigation            |
| **Recharts**     | 3.2     | Data Visualization    |
| **Axios**        | Latest  | HTTP Client           |
| **Lucide React** | Latest  | Icons                 |
| **Sonner**       | Latest  | Toast Notifications   |

### Backend

| Technology        | Version | Purpose          |
| ----------------- | ------- | ---------------- |
| **Node.js**       | 18+     | Runtime          |
| **Express.js**    | 4.22    | Web Framework    |
| **MongoDB**       | Latest  | Database         |
| **Mongoose**      | 8.20    | ODM              |
| **JWT**           | Latest  | Authentication   |
| **bcryptjs**      | Latest  | Password Hashing |
| **Google Gemini** | Latest  | AI Integration   |
| **LangChain**     | Latest  | AI Orchestration |
| **ChromaDB**      | Latest  | Vector Database  |
| **Multer**        | Latest  | File Uploads     |
| **PDF-parse**     | Latest  | PDF Processing   |
| **Tesseract.js**  | Latest  | OCR              |

---

## 🏗 Architecture

### System Architecture

```mermaid
graph TB
    subgraph Frontend
        A[React App] --> B[Admin Dashboard]
        A --> C[Merchant Dashboard]
        A --> D[Employee Dashboard]
        A --> E[Driver Dashboard]
    end

    subgraph Backend
        F[Express API] --> G[Auth Module]
        F --> H[Orders Module]
        F --> I[Users Module]
        F --> J[Drivers Module]
        F --> K[Locations Module]
        F --> L[AI Module]
    end

    subgraph Database
        M[(MongoDB)]
    end

    subgraph AI
        N[Google Gemini]
        O[ChromaDB]
    end

    A <--> F
    F <--> M
    L <--> N
    L <--> O
```

### Backend Modules

| Module              | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| **Auth**            | JWT authentication, login, registration, password management |
| **Users**           | User profile management and administrative controls          |
| **Orders**          | Order CRUD, status workflow, cost calculation                |
| **Drivers**         | Driver management, city assignment, availability             |
| **Locations**       | Governorates, cities, shipping fees                          |
| **Shipping Types**  | Shipping type configuration with adjustments                 |
| **Weight Settings** | Global weight limits and extra kg costs                      |
| **AI**              | Chat interface, document processing, RAG                     |

### AI Integration Architecture

```mermaid
graph LR
    A[User] -->|Message| B[Chat Interface]
    B -->|HTTP POST| C[AI Router]
    C -->|Query| D[Google Gemini]
    C -->|Context| E[ChromaDB RAG]
    D -->|Response| C
    E -->|Documents| C
    C -->|Reply| B
    B -->|Display| A
```

---

## 📁 Project Structure

```
shipping-dashboard/
│
├── client/                      # Frontend React Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/            # Login component
│   │   │   ├── dashboards/      # Role-specific dashboards
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── MerchantDashboard.tsx
│   │   │   │   ├── EmplyeeDashboard.tsx
│   │   │   │   └── DriverDashboard.tsx
│   │   │   ├── page/            # Feature pages
│   │   │   │   ├── OrderManagement.tsx
│   │   │   │   ├── DriverManagement.tsx
│   │   │   │   ├── UserManagement.tsx
│   │   │   │   ├── RegionsManagement.tsx
│   │   │   │   ├── ShippingTypeManagement.tsx
│   │   │   │   ├── WeightSettings.tsx
│   │   │   │   ├── CreateOrder.tsx
│   │   │   │   ├── MyOrders.tsx
│   │   │   │   ├── MyDeliveries.tsx
│   │   │   │   └── AiMode.tsx
│   │   │   ├── Layout/          # Layout components
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── ui/              # Reusable UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities and helpers
│   │   │   ├── api.ts           # Axios configuration
│   │   │   ├── shippingUtils.ts # Cost calculation
│   │   │   └── exportUtils.ts   # Export functionality
│   │   ├── types/               # TypeScript definitions
│   │   ├── contexts/            # React contexts
│   │   └── routes/              # Route configuration
│   ├── public/                  # Static assets
│   └── package.json
│
├── server/                      # Backend Node.js Application
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   ├── userController.js
│   │   ├── driverController.js
│   │   ├── locationController.js
│   │   ├── shippingTypeController.js
│   │   └── weightSettingsController.js
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT & RBAC
│   ├── models/
│   │   ├── Order.js
│   │   ├── User.js
│   │   ├── City.js
│   │   ├── Governotate.js
│   │   ├── ShippingType.js
│   │   └── WeightSetting.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── userRoutes.js
│   │   ├── driverRoutes.js
│   │   ├── locationRoutes.js
│   │   ├── shippingTypeRoutes.js
│   │   ├── weightSettingsRoute.js
│   │   └── aiRouter.js
│   ├── uploads/                 # File upload directory
│   ├── server.js                # Entry point
│   └── package.json
│
├── docs/                        # Documentation
│   └── WeightSettings_System_Documentation.md
│
└── README.md
```

---

## 🚀 Frontend Setup

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Navigate to frontend directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### Frontend Configuration

Create `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000
```

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## ⚙️ Backend Setup

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Docker (optional, for ChromaDB)

### Installation

```bash
# Navigate to backend directory
cd server

# Install dependencies
npm install
```

### Environment Configuration

Create `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000

# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/shipping_dashboard
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shipping_dashboard

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Google AI (for AI Assistant)
API_KEY=your_google_gemini_api_key

# ChromaDB (optional, for RAG)
CHROMA_URL=http://localhost:8000
```

### Running the Backend

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Starting ChromaDB (for AI features)

```bash
# Using Docker (recommended)
docker run -p 8000:8000 chromadb/chroma

# Or using Python
pip install chromadb
chroma run --host localhost --port 8000
```

---

## 🤖 AI Assistant

### Overview

The AI Assistant is an intelligent chat interface that allows users to:

- Ask questions about orders and data in natural language
- Upload and analyze documents (PDF, CSV, images)
- Generate visual charts and reports
- Get insights from historical data using RAG

### Features

| Feature                 | Description                |
| ----------------------- | -------------------------- |
| **Bilingual Support**   | Arabic and English         |
| **Voice Input**         | Web Speech API integration |
| **Document Processing** | PDF, CSV, Image analysis   |
| **RAG System**          | Context-aware responses    |
| **Chart Generation**    | Dynamic visualizations     |
| **Session Persistence** | Chat history storage       |

### Example Conversations

#### Arabic Query

```
المستخدم: كم عدد الطلبات اليوم؟
المساعد: لديك 25 طلب جديد اليوم. 15 منهم قيد الانتظار و10 قيد المعالجة.
```

#### English Query

```
User: Show me the order trends for this week
Assistant: Here's a chart showing your order trends...
```

### AI Pricing (Google Gemini)

| Usage          | Estimated Monthly Cost |
| -------------- | ---------------------- |
| 1,000 queries  | Free tier              |
| 10,000 queries | ~$5-10                 |
| 50,000 queries | ~$25-50                |

---

## 📖 API Documentation

### Authentication

| Endpoint             | Method | Description       |
| -------------------- | ------ | ----------------- |
| `/api/auth/login`    | POST   | User login        |
| `/api/auth/register` | POST   | User registration |
| `/api/auth/logout`   | POST   | User logout       |
| `/api/auth/me`       | GET    | Get current user  |

### Orders

| Endpoint                        | Method | Description                |
| ------------------------------- | ------ | -------------------------- |
| `/api/orders`                   | GET    | Get all orders (paginated) |
| `/api/orders/:id`               | GET    | Get order by ID            |
| `/api/orders`                   | POST   | Create new order           |
| `/api/orders/:id`               | PATCH  | Update order               |
| `/api/orders/:id`               | DELETE | Delete order               |
| `/api/orders/:id/status`        | PATCH  | Update status              |
| `/api/orders/:id/assign-driver` | PATCH  | Assign driver              |
| `/api/orders/calculate-cost`    | POST   | Calculate shipping cost    |

### Users

| Endpoint         | Method | Description    |
| ---------------- | ------ | -------------- |
| `/api/users`     | GET    | Get all users  |
| `/api/users/:id` | GET    | Get user by ID |
| `/api/users`     | POST   | Create user    |
| `/api/users/:id` | PUT    | Update user    |
| `/api/users/:id` | DELETE | Delete user    |

### Drivers

| Endpoint                         | Method | Description             |
| -------------------------------- | ------ | ----------------------- |
| `/api/drivers/all`               | GET    | Get all drivers         |
| `/api/drivers/by-city`           | GET    | Get drivers by city     |
| `/api/drivers/:id/availability`  | PATCH  | Toggle availability     |
| `/api/drivers/:id/assign-cities` | POST   | Assign cities           |
| `/api/drivers/my-deliveries`     | GET    | Get driver's deliveries |

### Locations

| Endpoint                                 | Method | Description               |
| ---------------------------------------- | ------ | ------------------------- |
| `/api/locations/governorates`            | GET    | Get all governorates      |
| `/api/locations/governorates`            | POST   | Create governorate        |
| `/api/locations/governorates/:id/cities` | GET    | Get cities by governorate |
| `/api/locations/cities`                  | GET    | Get all cities            |
| `/api/locations/cities`                  | POST   | Create city               |

### Shipping Types

| Endpoint                         | Method | Description            |
| -------------------------------- | ------ | ---------------------- |
| `/api/shipping-types`            | GET    | Get all shipping types |
| `/api/shipping-types`            | POST   | Create shipping type   |
| `/api/shipping-types/:id`        | PUT    | Update shipping type   |
| `/api/shipping-types/:id/toggle` | PATCH  | Toggle active status   |

### Weight Settings

| Endpoint               | Method | Description                  |
| ---------------------- | ------ | ---------------------------- |
| `/api/weight-settings` | GET    | Get settings                 |
| `/api/weight-settings` | PUT    | Update settings (Admin only) |

### AI Assistant

| Endpoint         | Method | Description        |
| ---------------- | ------ | ------------------ |
| `/api/ai/chat`   | POST   | Send message to AI |
| `/api/ai/upload` | POST   | Upload document    |

---

## 🔐 Security

- **JWT Token Authentication** - Secure API access
- **Bcrypt Password Hashing** - Secure password storage
- **Role-Based Access Control** - Feature restrictions by role
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Data sanitization
- **HTTP-Only Cookies** - XSS protection

### Role Permissions Matrix

| Feature         | Admin | Employee | Merchant | Courier |
| --------------- | :---: | :------: | :------: | :-----: |
| View All Orders |  ✅   |    ✅    |    ❌    |   ❌    |
| View Own Orders |  ✅   |    ✅    |    ✅    |   ✅    |
| Create Orders   |  ✅   |    ✅    |    ✅    |   ❌    |
| Assign Drivers  |  ✅   |    ✅    |    ❌    |   ❌    |
| Manage Users    |  ✅   |    ❌    |    ❌    |   ❌    |
| Manage Regions  |  ✅   |    ❌    |    ❌    |   ❌    |
| Weight Settings |  ✅   |    ❌    |    ❌    |   ❌    |
| View Analytics  |  ✅   |    ✅    |    ✅    |   ✅    |
| AI Assistant    |  ✅   |    ✅    |    ✅    |   ✅    |
| Export Reports  |  ✅   |    ✅    |    ✅    |   ✅    |

---

## 🚀 Deployment

### Production Checklist

#### Frontend

- [ ] Build optimized production bundle: `npm run build`
- [ ] Configure environment variables
- [ ] Set up CDN for static assets
- [ ] Enable HTTPS

#### Backend

- [ ] Use production MongoDB URI
- [ ] Set strong JWT secret
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (Nginx)

#### AI Assistant

- [ ] Set production environment variables
- [ ] Configure ChromaDB persistence
- [ ] Set API usage limits
- [ ] Enable error logging

### Example Nginx Configuration

```nginx
# Frontend
server {
    listen 80;
    server_name shipflow.com;

    location / {
        root /var/www/shipflow/client/dist;
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 80;
    server_name api.shipflow.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 Troubleshooting

### Frontend Issues

**Vite not starting?**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors?**

```bash
# Check TypeScript errors
npm run lint
```

### Backend Issues

**MongoDB connection error?**

- Verify MongoDB is running
- Check connection string in `.env`
- Ensure database exists

**Port already in use?**

```bash
# Find and kill process
netstat -ano | findstr :5000
taskkill /F /PID <PID>
```

### AI Assistant Issues

**ChromaDB connection error?**

- Ensure Docker container is running
- Check CHROMA_URL in `.env`

**API key error?**

- Verify Google API key is valid
- Check account has Gemini API access

---

## 📊 Performance

- **Frontend**: Optimized Vite build with code splitting
- **Backend**: Express.js with efficient MongoDB queries
- **Database**: Indexed queries for fast lookups
- **Pagination**: Server-side pagination for large datasets
- **Caching**: Browser caching for static assets
- **AI Response Time**: 2-5 seconds average

---

## 🔮 Future Enhancements

### Platform

- [ ] Mobile application (React Native)
- [ ] Push notifications
- [ ] SMS notifications for customers
- [ ] Multi-language support
- [ ] Payment integration
- [ ] Customer tracking portal

### AI Assistant

- [ ] Voice output (Text-to-Speech)
- [ ] Predictive analytics
- [ ] Automated order processing
- [ ] Custom report generation
- [ ] Integration with external systems

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is part of ITI Graduation Project.

---

## 🙏 Credits

Built with:

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Recharts](https://recharts.org/)
- [Google Gemini AI](https://ai.google.dev/)
- [ChromaDB](https://www.trychroma.com/)
- [LangChain](https://www.langchain.com/)
- Love and ☕

---

## 📧 Support

For support, open an issue in the repository.

---

<div align="center">

**Transform shipping management with AI-powered intelligence!** 📦🤖

Made with ❤️ by the FlashLine Team

**Ahmed Magdy** • **Ruba Ismail** • **Sefin Kameil** • **Ahmed Ibrahim** • **Ahmed Olwy** • **Youssef Shaban**

---

[Frontend Setup](#-frontend-setup) • [Backend Setup](#-backend-setup) • [AI Assistant](#-ai-assistant) • [API Docs](#-api-documentation)

</div>
