# 🏥 Zenith Pharmacy Management System

> A comprehensive, AI-powered pharmacy management platform built with Next.js, Supabase, and Gemini AI

[![Next.js](https://img.shields.io/badge/Next.js-16.1.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-orange?style=flat-square&logo=google)](https://ai.google.dev/)

## 🌟 Overview

Zenith Pharmacy Management System is a modern, full-stack healthcare platform that revolutionizes pharmacy operations through AI-powered insights, predictive analytics, and comprehensive inventory management. Built for pharmacies of all sizes, it combines traditional pharmacy workflows with cutting-edge technology to optimize operations and improve patient care.

## ✨ Key Features

### 🤖 AI-Powered Intelligence
- **Smart Restock Predictions**: Gemini AI analyzes prescription patterns and inventory levels to predict optimal restock quantities
- **Intelligent Chatbot**: Real-time inventory queries with medical disclaimers and safety protocols
- **Predictive Analytics**: 30-day usage forecasting based on historical prescription data
- **Confidence Scoring**: AI provides reliability metrics for all recommendations

### 📊 Comprehensive Dashboard
- **Real-Time Analytics**: Live metrics for sales, inventory, and prescription trends
- **Interactive Calendar**: Medicine expiry dates with detailed hover information
- **KPI Monitoring**: Revenue tracking, low stock alerts, and expiration warnings
- **Visual Charts**: Professional healthcare-focused data visualization

### 💊 Advanced Inventory Management
- **Automated Tracking**: Real-time stock levels with batch management
- **Expiry Monitoring**: Visual indicators and automated alerts for expiring medicines
- **Supplier Integration**: Complete vendor management with contact information
- **Low Stock Alerts**: Proactive notifications before stockouts occur

### 🏪 Point of Sale System
- **Customer Management**: Complete patient profiles with prescription history
- **Payment Processing**: Multiple payment methods with transaction tracking
- **Real Medicine Data**: Integration with actual pharmaceutical databases
- **Receipt Generation**: Professional invoicing with detailed line items

### 👥 User Management
- **Role-Based Access**: Manager, Pharmacist, and User permission levels
- **Secure Authentication**: Supabase Auth with session management
- **Team Collaboration**: Internal messaging system with priority tags
- **Activity Logging**: Comprehensive audit trails for compliance

### 📈 Prescription Analytics
- **Patient Tracking**: Complete medication history and refill patterns
- **Physician Integration**: Doctor profiles with prescription analytics
- **Usage Patterns**: Identify trending medications and seasonal variations
- **Compliance Monitoring**: Track medication adherence and refill schedules

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.1.0**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/ui**: Professional component library
- **Recharts**: Data visualization
- **Lucide React**: Modern icon system

### Backend
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Next.js API Routes**: Serverless backend functions
- **Row Level Security**: Database-level access control
- **Real-time Updates**: Live data synchronization

### AI & Analytics
- **Google Gemini AI**: Advanced language model for predictions
- **Custom Algorithms**: Mathematical models for inventory optimization
- **Data Analysis**: Pattern recognition and trend analysis
- **Confidence Metrics**: Reliability scoring for AI recommendations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google AI API key (for Gemini integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/zenith-pharmacy.git
   cd zenith-pharmacy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Populate sample data
   npm run populate-data
   
   # Import CSV data (optional)
   npm run import-csv
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
zenith-pharmacy/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── chatbot/              # AI chatbot integration
│   │   ├── dashboard/            # Dashboard data APIs
│   │   ├── inventory/            # Inventory management
│   │   ├── medicine/             # Medicine CRUD operations
│   │   ├── messages/             # Internal messaging
│   │   ├── notifications/        # Alert system
│   │   ├── predictions/          # AI prediction models
│   │   ├── prescriptions/        # Prescription management
│   │   ├── sales/                # POS system
│   │   └── users/                # User management
│   ├── dashboard/                # Main application pages
│   │   ├── components/           # Dashboard components
│   │   ├── inventory/            # Inventory management UI
│   │   ├── messages/             # Messaging interface
│   │   ├── sales/                # Point of sale UI
│   │   ├── settings/             # Admin settings
│   │   └── tracking/             # Comprehensive tracking
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable components
│   ├── ui/                       # Shadcn/ui components
│   ├── AuthProvider.tsx          # Authentication context
│   └── LoginButton.tsx           # Login component
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication helpers
│   ├── supabase.ts               # Database client
│   └── utils.ts                  # Common utilities
├── scripts/                      # Data management scripts
│   ├── import-csv-data.js        # CSV import utility
│   ├── populate-sample-data.js   # Sample data generator
│   └── README.md                 # Scripts documentation
├── types/                        # TypeScript definitions
└── public/                       # Static assets
```

## 🗄️ Database Schema

### Core Tables
- **medicines**: Drug information with NDC codes and generic names
- **inventory**: Stock levels, batches, and supplier information
- **patients**: Customer profiles and contact information
- **prescriptions**: Medication orders with physician details
- **physicians**: Doctor profiles and specializations
- **sales**: Transaction records and payment tracking
- **users**: System users with role-based permissions
- **messages**: Internal communication system
- **notifications**: Alert and notification management
- **restock_suggestions**: AI-generated inventory recommendations

### Key Relationships
- Prescriptions link patients, physicians, and medicines
- Inventory tracks medicine stock levels and expiry dates
- Sales connect customers with purchased medicines
- Messages enable team communication with priority tags

## 🔧 API Documentation

### Authentication
All API routes are protected with Supabase Auth and role-based access control.

### Key Endpoints

#### Medicine Management
- `GET /api/medicine` - List all medicines with pagination
- `POST /api/medicine` - Add new medicine
- `PUT /api/medicine/[id]` - Update medicine details
- `DELETE /api/medicine/[id]` - Remove medicine

#### Inventory Operations
- `GET /api/inventory` - Current stock levels
- `POST /api/inventory` - Add inventory batch
- `PUT /api/inventory/[id]` - Update stock quantities

#### AI Predictions
- `POST /api/predictions/restock-gemini` - Generate AI restock recommendations
- `GET /api/restock-suggestions` - Retrieve saved suggestions

#### Sales System
- `POST /api/sales` - Process new sale
- `GET /api/sales` - Sales history and analytics

#### Chatbot
- `POST /api/chatbot` - AI-powered inventory queries

## 🤖 AI Features

### Restock Predictions
The system uses Google Gemini AI to analyze:
- Historical prescription patterns
- Current inventory levels
- Seasonal trends and variations
- Lead times and supplier reliability

### Chatbot Capabilities
- Real-time inventory queries
- Medicine information lookup
- Stock level alerts
- Medical disclaimers and safety protocols

### Confidence Scoring
All AI recommendations include:
- Confidence percentage (0-100%)
- Detailed reasoning
- Risk assessment
- Alternative suggestions

## 📊 Data Import

### CSV Integration
The system supports importing data from:
- **DRUGS.csv**: Medicine database with NDC codes
- **PATIENT1.csv**: Customer information
- **PRESCRIPTIONS.csv**: Historical prescription data

### Import Process
```bash
# Place CSV files in project root
npm run import-csv
```

The import script automatically:
- Maps CSV columns to database fields
- Converts date formats (MM/YY to full dates)
- Links related records via NDC codes
- Validates data integrity

## 🔐 Security Features

### Authentication
- Supabase Auth with secure session management
- Role-based access control (Manager/Pharmacist/User)
- Protected API routes with middleware

### Data Protection
- Row Level Security (RLS) policies
- Encrypted sensitive information
- Audit trails for compliance
- HIPAA-compliant data handling

### Access Control
- **Manager**: Full system access and user management
- **Pharmacist**: Medicine and prescription management
- **User**: Limited read-only access

## 🎨 UI/UX Design

### Design System
- Professional healthcare-focused dark theme
- Consistent component library with Shadcn/ui
- Responsive design for all device sizes
- Accessibility-compliant interfaces

### Key Components
- Interactive dashboards with real-time updates
- Color-coded priority systems
- Hover tooltips with detailed information
- Professional data visualization

## 📱 Features by Page

### Dashboard
- Real-time KPI metrics
- Interactive calendar with expiry dates
- Revenue and inventory charts
- Quick action buttons

### Tracking
- **Restock Suggestions**: AI-powered recommendations
- **Expiry Tracking**: Medicine expiration management
- **Prescription Analytics**: Patient medication patterns

### Inventory
- Stock level monitoring
- Batch management
- Supplier information
- Low stock alerts

### Sales
- Point of sale interface
- Customer management
- Payment processing
- Transaction history

### Messages
- Team communication
- Priority tagging system
- Real-time notifications
- Message threading

### Settings
- User management
- Role assignments
- System configuration
- Data export tools

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables
Ensure all environment variables are configured in your deployment platform:
- Supabase credentials
- Gemini AI API key
- Authentication secrets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the robust backend infrastructure
- **Google Gemini AI** for advanced language model capabilities
- **Shadcn/ui** for the beautiful component library
- **Next.js** team for the excellent React framework

## 📞 Support

For support, email support@zenithpharmacy.com or join our [Discord community](https://discord.gg/zenithpharmacy).

## 🔮 Roadmap

### Upcoming Features
- [ ] Mobile app development
- [ ] Advanced reporting and analytics
- [ ] Integration with pharmacy benefit managers
- [ ] Automated insurance verification
- [ ] Prescription delivery tracking
- [ ] Multi-location support
- [ ] Advanced AI drug interaction checking
- [ ] Regulatory compliance automation

---

**Built with ❤️ for the healthcare community.**

