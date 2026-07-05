# Sample Data Population Script

## Overview
This script populates the database with comprehensive sample data for testing and demonstration purposes.

## What it creates:

### 🏥 **5 Sample Medicines**
- **Paracetamol** (500mg) - Pain reliever and fever reducer
- **Ibuprofen** (400mg) - Anti-inflammatory pain reliever  
- **Amoxicillin** (250mg) - Antibiotic for bacterial infections
- **Aspirin** (75mg) - Blood thinner and pain reliever
- **Omeprazole** (20mg) - Proton pump inhibitor for acid reflux

### 📦 **Inventory Records**
- Different stock levels to demonstrate various scenarios:
  - **Low Stock**: Ibuprofen (8 units, below minimum of 15)
  - **Normal Stock**: Paracetamol, Amoxicillin, Omeprazole
  - **Overstock**: Aspirin (200 units, above maximum of 150)
- Realistic batch numbers, suppliers, and purchase dates
- Proper purchase and selling prices

### 💰 **5 Sample Sales Transactions**
- **John Smith**: Cash purchase (Paracetamol + Ibuprofen) with discount
- **Sarah Johnson**: Card payment (Amoxicillin prescription)
- **Michael Brown**: UPI payment (Aspirin + Omeprazole bulk purchase)
- **Walk-in Customer**: Cash purchase (Paracetamol)
- **Emily Davis**: Card payment (Ibuprofen + Aspirin) with insurance

### 📊 **Stock Movements**
- Initial purchase records for all inventory
- Sales deductions for each transaction
- Complete audit trail with timestamps and notes

### 🤖 **Restock Predictions**
- ML-style predictions for 3 medicines
- Predicted stock-out dates (8-25 days)
- Recommended reorder quantities
- Confidence scores (78-92%)

## Usage

### Run the script:
```bash
npm run populate-data
```

### What happens:
1. **Finds existing user** (you must be logged in first)
2. **Clears existing data** (medicines, inventory, sales)
3. **Creates sample medicines** with realistic details
4. **Populates inventory** with varied stock levels
5. **Generates sales transactions** with different customers and payment methods
6. **Updates inventory** based on sales (realistic stock deduction)
7. **Creates stock movements** for complete audit trail
8. **Generates predictions** for restocking recommendations

## Features Demonstrated

### 🎯 **Stock Status Scenarios**
- **Low Stock Alert**: Ibuprofen shows as low stock (red indicator)
- **Normal Stock**: Most medicines in healthy range (green)
- **Overstock**: Aspirin shows overstock warning (blue)

### 💳 **Payment Methods**
- Cash transactions
- Card payments  
- UPI payments
- Bank transfers

### 👥 **Customer Types**
- Regular customers with contact info
- Walk-in customers (anonymous)
- Insurance co-pay scenarios
- Bulk purchase discounts

### 📈 **Analytics Data**
- Revenue tracking across different payment methods
- Item sales velocity for predictions
- Customer purchase patterns
- Inventory turnover rates

## Database Impact

The script creates:
- ✅ **5 medicines** with complete details
- ✅ **5 inventory records** with realistic stock levels
- ✅ **5 sales transactions** with 8 total line items
- ✅ **13 stock movements** (5 purchases + 8 sales)
- ✅ **3 restock predictions** with ML-style data

## Safety Features

- **User Validation**: Requires existing user (must login first)
- **Data Cleanup**: Clears existing sample data before creating new
- **Error Handling**: Comprehensive error checking and rollback
- **Foreign Key Safety**: Creates data in correct order
- **Transaction Integrity**: Updates inventory atomically with sales

## Testing the Results

After running the script, you can:

1. **Visit Sales Page** (`/dashboard/sales`):
   - See 5 completed transactions
   - Different customers and payment methods
   - Revenue analytics and statistics

2. **Visit Inventory Page** (`/dashboard/inventory`):
   - View stock levels with color-coded status
   - See low stock alerts (Ibuprofen)
   - Check overstock warnings (Aspirin)
   - Review restock predictions

3. **Test API Endpoints** (`/dashboard/test-apis`):
   - Verify all APIs return proper data
   - Check sales with line items
   - Validate inventory with medicine details

## Customization

You can modify the script to:
- Add more medicines or customers
- Change stock levels or prices
- Create different sales scenarios
- Adjust prediction parameters
- Add seasonal variations

The script is designed to be run multiple times safely - it will clear and recreate all sample data each time.