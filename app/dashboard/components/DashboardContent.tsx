'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Users,
  Calendar as CalendarIcon,
  Activity,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardData {
  sales: {
    total: number;
    count: number;
    today: number;
    growth: number;
    recentSales: any[];
    dailySales: any[];
    paymentMethods: any[];
  };
  inventory: {
    totalItems: number;
    totalValue: number;
    lowStock: number;
    outOfStock: number;
    topMedicines: any[];
    stockLevels: any[];
  };
  predictions: {
    count: number;
    urgentCount: number;
    predictions: any[];
  };
  medicines: {
    total: number;
    expiringSoon: number;
    expired: number;
  };
}

export default function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [salesRes, inventoryRes, medicinesRes, predictionsRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/inventory'),
        fetch('/api/medicine'),
        fetch('/api/restock-suggestions')
      ]);

      const [salesData, inventoryData, medicinesData, predictionsData] = await Promise.all([
        salesRes.ok ? salesRes.json() : { sales: [] },
        inventoryRes.ok ? inventoryRes.json() : [],
        medicinesRes.ok ? medicinesRes.json() : [],
        predictionsRes.ok ? predictionsRes.json() : { recommendations: [] }
      ]);

      // Process sales data
      const sales = salesData.sales || [];
      const totalRevenue = sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.final_amount), 0);
      const todaysSales = sales.filter((sale: any) => {
        const saleDate = new Date(sale.created_at).toDateString();
        const today = new Date().toDateString();
        return saleDate === today;
      });
      const todaysRevenue = todaysSales.reduce((sum: number, sale: any) => sum + parseFloat(sale.final_amount), 0);

      // Calculate growth (mock calculation for demo)
      const growth = Math.random() * 20 - 10; // Random growth between -10% and +10%

      // Process daily sales for chart
      const dailySalesMap = new Map();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      last7Days.forEach(date => dailySalesMap.set(date, 0));
      
      sales.forEach((sale: any) => {
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        if (dailySalesMap.has(saleDate)) {
          dailySalesMap.set(saleDate, dailySalesMap.get(saleDate) + parseFloat(sale.final_amount));
        }
      });

      const dailySales = Array.from(dailySalesMap.entries()).map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: amount,
        sales: sales.filter((s: any) => new Date(s.created_at).toISOString().split('T')[0] === date).length
      }));

      // Payment methods distribution
      const paymentMethodsMap = new Map();
      sales.forEach((sale: any) => {
        const method = sale.payment_method || 'cash';
        paymentMethodsMap.set(method, (paymentMethodsMap.get(method) || 0) + parseFloat(sale.final_amount));
      });

      const paymentMethods = Array.from(paymentMethodsMap.entries()).map(([method, amount]) => ({
        name: method.charAt(0).toUpperCase() + method.slice(1),
        value: amount,
        count: sales.filter((s: any) => s.payment_method === method).length
      }));

      // Process inventory data
      const inventory = inventoryData || [];
      const totalValue = inventory.reduce((sum: number, item: any) => 
        sum + (item.quantity_in_stock * item.selling_price), 0
      );
      const lowStock = inventory.filter((item: any) => 
        item.quantity_in_stock <= item.minimum_stock_level
      ).length;
      const outOfStock = inventory.filter((item: any) => 
        item.quantity_in_stock <= 0
      ).length;

      // Top medicines by stock value
      const topMedicines = inventory
        .map((item: any) => ({
          name: item.medicines?.name || 'Unknown',
          value: item.quantity_in_stock * item.selling_price,
          quantity: item.quantity_in_stock,
          status: item.quantity_in_stock <= item.minimum_stock_level ? 'low' : 
                  item.quantity_in_stock >= item.maximum_stock_level ? 'high' : 'normal'
        }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 5);

      // Stock levels distribution
      const stockLevels = [
        { name: 'Normal', value: inventory.filter((i: any) => 
          i.quantity_in_stock > i.minimum_stock_level && i.quantity_in_stock < i.maximum_stock_level
        ).length, color: '#10B981' },
        { name: 'Low Stock', value: lowStock, color: '#F59E0B' },
        { name: 'Out of Stock', value: outOfStock, color: '#EF4444' },
        { name: 'Overstock', value: inventory.filter((i: any) => 
          i.quantity_in_stock >= i.maximum_stock_level
        ).length, color: '#3B82F6' }
      ];

      // Process medicines data
      const medicines = medicinesData || [];
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const expiringSoon = medicines.filter((med: any) => {
        const expiryDate = new Date(med.expiry_date);
        return expiryDate <= thirtyDaysFromNow && expiryDate > today;
      }).length;

      const expired = medicines.filter((med: any) => {
        const expiryDate = new Date(med.expiry_date);
        return expiryDate <= today;
      }).length;

      // Process predictions data
      const predictions = predictionsData.recommendations || [];
      const urgentPredictions = predictions.filter((pred: any) => {
        return pred.urgency === 'critical' || pred.urgency === 'high';
      }).length;

      setData({
        sales: {
          total: totalRevenue,
          count: sales.length,
          today: todaysRevenue,
          growth: growth,
          recentSales: sales.slice(0, 5),
          dailySales: dailySales,
          paymentMethods: paymentMethods
        },
        inventory: {
          totalItems: inventory.length,
          totalValue: totalValue,
          lowStock: lowStock,
          outOfStock: outOfStock,
          topMedicines: topMedicines,
          stockLevels: stockLevels
        },
        predictions: {
          count: predictions.length,
          urgentCount: urgentPredictions,
          predictions: predictions.slice(0, 3)
        },
        medicines: {
          total: medicines.length,
          expiringSoon: expiringSoon,
          expired: expired
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#41cbe2]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Failed to load dashboard data</div>
      </div>
    );
  }

  const COLORS = ['#41cbe2', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold">${data.sales.total.toFixed(2)}</p>
              <div className="flex items-center mt-2">
                {data.sales.growth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-300 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-300 mr-1" />
                )}
                <span className={`text-sm ${data.sales.growth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {Math.abs(data.sales.growth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Sales</p>
              <p className="text-2xl font-bold">{data.sales.count}</p>
              <p className="text-green-200 text-sm mt-2">Today: ${data.sales.today.toFixed(2)}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Inventory Value</p>
              <p className="text-2xl font-bold">${data.inventory.totalValue.toFixed(2)}</p>
              <p className="text-purple-200 text-sm mt-2">{data.inventory.totalItems} items</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Stock Alerts</p>
              <p className="text-2xl font-bold">{data.inventory.lowStock + data.inventory.outOfStock}</p>
              <p className="text-orange-200 text-sm mt-2">{data.predictions.urgentCount} urgent</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <div className="flex space-x-2">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.sales.dailySales}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#41cbe2" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#41cbe2" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#41cbe2"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.sales.paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.sales.paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory and Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Levels */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Stock Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.inventory.stockLevels} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#666" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#666" fontSize={12} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#41cbe2" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Medicines */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Medicines by Value</h3>
          <div className="space-y-4">
            {data.inventory.topMedicines.map((medicine, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {medicine.name}
                    </div>
                    <div className={`ml-2 w-2 h-2 rounded-full ${
                      medicine.status === 'low' ? 'bg-red-500' :
                      medicine.status === 'high' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {medicine.quantity} units
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  ${medicine.value.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Restock Predictions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Restock Alerts</h3>
          <div className="space-y-4">
            {data.predictions.predictions.map((prediction, index) => (
              <div key={index} className="border-l-4 border-orange-400 pl-4">
                <div className="text-sm font-medium text-gray-900">
                  {prediction.medicines?.name || 'Unknown Medicine'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Stock out: {new Date(prediction.predicted_stock_out_date).toLocaleDateString()}
                </div>
                <div className="text-xs text-orange-600 font-medium mt-1">
                  Reorder: {prediction.recommended_reorder_quantity} units
                </div>
                <div className="text-xs text-gray-400">
                  Confidence: {Math.round(prediction.confidence_score * 100)}%
                </div>
              </div>
            ))}
            {data.predictions.predictions.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No predictions available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Sales</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.sales.recentSales.map((sale, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sale.customer_name || 'Walk-in Customer'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseFloat(sale.final_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}