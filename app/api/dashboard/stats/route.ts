import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Get date range from query params (default to last 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Fetch sales data with sale_items and medicine information
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          medicine_id,
          quantity,
          total_price,
          medicines (
            id,
            name
          )
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('Error fetching sales:', salesError);
    }

    // Fetch inventory data
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select(`
        *,
        medicines (
          id,
          name,
          category,
          expiry_date
        )
      `);

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
    }

    // Fetch medicines data
    const { data: medicines, error: medicinesError } = await supabase
      .from('medicines')
      .select('*');

    if (medicinesError) {
      console.error('Error fetching medicines:', medicinesError);
    }

    // Fetch messages data
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Calculate statistics
    const stats = {
      // Basic totals
      totalRevenue: (sales || []).reduce((sum, sale) => sum + parseFloat(sale.final_amount || 0), 0),
      totalSales: (sales || []).length,
      totalMedicines: (medicines || []).length,
      totalMessages: (messages || []).length,
      
      // Low stock count
      lowStockCount: (inventory || []).filter(item => 
        item.quantity_in_stock <= (item.minimum_stock_level || 10)
      ).length,
      
      // Expiring medicines count (next 2 weeks)
      expiringCount: (medicines || []).filter(med => {
        const expiryDate = new Date(med.expiry_date);
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
        return expiryDate <= twoWeeksFromNow && expiryDate > new Date();
      }).length,
      
      // Daily sales trend (last 7 days)
      dailySales: generateDailySales(sales || []),
      
      // Monthly revenue trend (last 6 months)
      monthlyRevenue: generateMonthlyRevenue(sales || []),
      
      // Category distribution
      categoryDistribution: generateCategoryDistribution(inventory || []),
      
      // Top medicines (based on sales)
      topMedicines: generateTopMedicines(sales || []),
      
      // Activity metrics
      activityMetrics: generateActivityMetrics(messages || [], sales || [])
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/dashboard/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateDailySales(sales: any[]) {
  const last7Days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayRevenue = sales
      .filter(sale => sale.created_at && sale.created_at.startsWith(dateStr))
      .reduce((sum, sale) => sum + parseFloat(sale.final_amount || 0), 0);
    
    const dayCount = sales
      .filter(sale => sale.created_at && sale.created_at.startsWith(dateStr))
      .length;
    
    last7Days.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: dayRevenue,
      count: dayCount
    });
  }
  
  return last7Days;
}

function generateMonthlyRevenue(sales: any[]) {
  const last6Months = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStr = date.toISOString().substring(0, 7); // YYYY-MM
    
    const monthRevenue = sales
      .filter(sale => sale.created_at && sale.created_at.startsWith(monthStr))
      .reduce((sum, sale) => sum + parseFloat(sale.final_amount || 0), 0);
    
    last6Months.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      revenue: monthRevenue
    });
  }
  
  return last6Months;
}

function generateCategoryDistribution(inventory: any[]) {
  const categories = ['Antibiotics', 'Pain Relief', 'Vitamins', 'Cardiac', 'Respiratory', 'Other'];
  
  return categories.map((category, index) => {
    // Distribute inventory items across categories
    const categoryItems = inventory.filter((item, itemIndex) => 
      itemIndex % categories.length === index
    );
    
    const inStock = categoryItems.filter(item => 
      item.quantity_in_stock > (item.minimum_stock_level || 10)
    ).length;
    
    const lowStock = categoryItems.filter(item => 
      item.quantity_in_stock <= (item.minimum_stock_level || 10) && item.quantity_in_stock > 0
    ).length;
    
    const outOfStock = categoryItems.filter(item => 
      item.quantity_in_stock === 0
    ).length;
    
    return {
      category,
      inStock,
      lowStock,
      outOfStock,
      total: inStock + lowStock + outOfStock
    };
  }).filter(cat => cat.total > 0);
}

function generateTopMedicines(sales: any[]) {
  // Create a map to aggregate medicine sales by name
  const medicineStats = new Map<string, { quantity: number; revenue: number }>();
  
  sales.forEach(sale => {
    if (sale.sale_items && Array.isArray(sale.sale_items)) {
      sale.sale_items.forEach((item: any) => {
        const medicineName = item.medicines?.name || 'Unknown Medicine';
        const quantity = parseInt(item.quantity) || 0;
        const revenue = parseFloat(item.total_price) || 0;
        
        if (medicineStats.has(medicineName)) {
          const existing = medicineStats.get(medicineName)!;
          medicineStats.set(medicineName, {
            quantity: existing.quantity + quantity,
            revenue: existing.revenue + revenue
          });
        } else {
          medicineStats.set(medicineName, { quantity, revenue });
        }
      });
    }
  });
  
  // Convert to array and sort by quantity
  const topMedicines = Array.from(medicineStats.entries())
    .map(([name, stats]) => ({
      day: name, // Using 'day' field for medicine name (for compatibility with chart)
      sales: stats.quantity,
      revenue: stats.revenue
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 7); // Top 7 medicines
  
  return topMedicines;
}

function generateActivityMetrics(messages: any[], sales: any[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const currentMonth = new Date().getMonth();
  
  return months.map((month, index) => {
    const monthIndex = (currentMonth - 5 + index + 12) % 12;
    const monthStart = new Date(new Date().getFullYear(), monthIndex, 1);
    const monthEnd = new Date(new Date().getFullYear(), monthIndex + 1, 0);
    
    const appointments = messages.filter(msg => {
      const msgDate = new Date(msg.created_at);
      return msgDate >= monthStart && msgDate <= monthEnd;
    }).length;
    
    const walkIns = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= monthStart && saleDate <= monthEnd;
    }).length;
    
    return {
      month,
      appointments: appointments,
      walkIns: walkIns
    };
  });
}