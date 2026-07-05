# Sales & Inventory Management System

## Overview
A comprehensive sales and inventory management system with role-based authentication, predictive restocking, and complete business workflow management.

## 🔐 Role-Based Authentication

### User Roles
- **Admin**: Full system access, user management, all features
- **Manager**: Sales, inventory, predictions, user oversight
- **Pharmacist**: Sales, basic inventory viewing, medicine management
- **User**: Basic medicine tracking and expiration monitoring

### Admin Configuration
- Admin emails are configured in `.env` file: `ADMIN_EMAILS=admin@example.com,manager@example.com`
- New users with admin emails automatically get admin privileges
- Admins can manage user roles and permissions via Settings page

## 💰 Sales Management

### Features
- **Point of Sale (POS)**: Complete sales transaction processing
- **Customer Management**: Track customer information (optional)
- **Multiple Payment Methods**: Cash, Card, UPI, Bank Transfer
- **Discount & Tax Handling**: Flexible pricing adjustments
- **Real-time Inventory Updates**: Automatic stock deduction
- **Sales Analytics**: Revenue tracking, order statistics

### Sales Workflow
1. **Create Sale**: Add customer info (optional)
2. **Add Items**: Select medicines, quantities, prices
3. **Apply Adjustments**: Discounts, taxes
4. **Process Payment**: Choose payment method
5. **Complete Transaction**: Automatic inventory update

### API Endpoints
- `GET /api/sales` - Fetch sales with pagination and filters
- `POST /api/sales` - Create new sale transaction

## 📦 Inventory Management

### Features
- **Stock Tracking**: Real-time inventory levels
- **Batch Management**: Track medicine batches and suppliers
- **Stock Alerts**: Low stock and out-of-stock notifications
- **Price Management**: Purchase and selling price tracking
- **Supplier Information**: Vendor management
- **Stock Movements**: Complete audit trail

### Inventory Workflow
1. **Add Stock**: Purchase new inventory
2. **Set Levels**: Configure min/max stock levels
3. **Monitor Status**: Track stock levels and alerts
4. **Restock Alerts**: Automated low stock notifications

### Stock Status Indicators
- **Normal**: Green - Adequate stock levels
- **Low Stock**: Yellow - Below minimum threshold
- **Out of Stock**: Red - Zero inventory
- **Overstock**: Blue - Above maximum threshold

### API Endpoints
- `GET /api/inventory` - Fetch inventory with filters
- `POST /api/inventory` - Add new stock

## 🤖 Predictive Restocking Model

### Machine Learning Features
- **Sales Velocity Analysis**: Historical sales pattern analysis
- **Seasonal Adjustments**: Monthly demand variations
- **Stock-out Predictions**: Predict when medicines will run out
- **Reorder Recommendations**: Suggested restock quantities
- **Confidence Scoring**: Prediction reliability metrics

### Prediction Factors
- **Historical Sales Data**: 90-day sales analysis
- **Current Stock Levels**: Real-time inventory
- **Seasonal Trends**: Monthly demand patterns
- **Lead Times**: Supplier delivery schedules
- **Safety Stock**: Buffer calculations

### Model Algorithm
1. **Data Collection**: Gather 90 days of sales data
2. **Trend Analysis**: Calculate daily sales velocity
3. **Seasonal Adjustment**: Apply monthly multipliers
4. **Stock Projection**: Predict stock depletion date
5. **Reorder Calculation**: Determine optimal restock quantity

### API Endpoints
- `GET /api/predictions/restock` - Fetch current predictions
- `POST /api/predictions/restock` - Generate new predictions

## ⚙️ Settings & User Management

### Admin Features
- **User Role Management**: Assign roles to users
- **Permission Control**: Grant/revoke admin privileges
- **User Overview**: View all system users
- **Account Management**: Edit user information

### User Management Workflow
1. **View Users**: List all registered users
2. **Edit Roles**: Change user permissions
3. **Admin Assignment**: Grant admin privileges
4. **User Removal**: Delete user accounts (except self)

## 🗄️ Database Schema

### New Tables
- **sales**: Transaction records
- **sale_items**: Individual sale line items
- **inventory**: Stock management
- **stock_movements**: Inventory audit trail
- **restock_predictions**: ML predictions

### Enhanced Tables
- **users**: Added role and is_admin fields
- **medicines**: Added pricing and barcode fields

## 🔒 Security & Permissions

### Access Control
- **Route Protection**: Layout-based authentication
- **API Security**: Role-based endpoint access
- **Data Isolation**: Users see only their data
- **Admin Privileges**: Elevated access controls

### Permission Matrix
| Feature | User | Pharmacist | Manager | Admin |
|---------|------|------------|---------|-------|
| View Medicines | ✅ | ✅ | ✅ | ✅ |
| Add Medicines | ✅ | ✅ | ✅ | ✅ |
| Sales | ❌ | ✅ | ✅ | ✅ |
| Inventory | ❌ | 👁️ | ✅ | ✅ |
| Predictions | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |

## 📊 Analytics & Reporting

### Sales Metrics
- **Total Revenue**: Sum of all sales
- **Order Count**: Number of transactions
- **Items Sold**: Total quantity sold
- **Average Order Value**: Revenue per transaction

### Inventory Metrics
- **Total Items**: Inventory count
- **Low Stock Alerts**: Items below minimum
- **Out of Stock**: Zero inventory items
- **Total Value**: Inventory worth

### Prediction Metrics
- **Stock-out Dates**: Predicted depletion
- **Reorder Quantities**: Recommended purchases
- **Confidence Scores**: Prediction reliability

## 🚀 Getting Started

### Environment Setup
1. Add admin emails to `.env`:
   ```
   ADMIN_EMAILS=admin@example.com,manager@example.com
   ```

2. Database migrations are automatically applied

3. First admin user is created on login with admin email

### Initial Setup
1. **Login as Admin**: Use configured admin email
2. **Add Medicines**: Create medicine catalog
3. **Add Inventory**: Stock medicines with pricing
4. **Set Stock Levels**: Configure min/max thresholds
5. **Generate Predictions**: Run ML model
6. **Create Users**: Invite team members
7. **Assign Roles**: Set appropriate permissions

## 🔧 Technical Implementation

### Frontend Architecture
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Role-based Components**: Conditional rendering

### Backend Architecture
- **Next.js API Routes**: RESTful endpoints
- **Supabase**: PostgreSQL database
- **NextAuth.js**: Authentication system
- **Custom Auth Layer**: Role-based access control

### Machine Learning
- **Simple Linear Model**: Sales velocity prediction
- **Seasonal Adjustments**: Monthly demand patterns
- **Confidence Scoring**: Prediction reliability
- **Real-time Updates**: Dynamic recalculation

## 📈 Future Enhancements

### Planned Features
- **Advanced ML Models**: Neural networks for better predictions
- **Barcode Scanning**: Mobile inventory management
- **Supplier Integration**: Automated purchase orders
- **Financial Reporting**: Profit/loss analysis
- **Mobile App**: React Native companion
- **API Integration**: Third-party system connections

### Scalability Considerations
- **Database Optimization**: Indexing and partitioning
- **Caching Layer**: Redis for performance
- **Microservices**: Service decomposition
- **Load Balancing**: Horizontal scaling
- **Data Warehousing**: Analytics optimization