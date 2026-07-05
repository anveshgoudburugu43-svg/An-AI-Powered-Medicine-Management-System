'use client';

'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Tooltip
} from 'recharts';

// Income/Expense Donut Chart
export function IncomeChart({ data }: { data: { income: number; expense: number } }) {
  const chartData = [
    { name: 'Income', value: data.income, color: '#41cbe2' },
    { name: 'Expense', value: data.expense, color: '#ff6b6b' }
  ];

  const total = data.income + data.expense;

  return (
    <div className="flex flex-col items-center h-full min-h-[300px]">
      <div className="relative flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-white text-lg font-bold">₹{data.income.toLocaleString('en-IN')}</div>
          <div className="text-gray-400 text-xs">Income</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-8 mt-4 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#41cbe2]"></div>
          <span className="text-white text-xs font-medium">Income</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>
          <span className="text-white text-xs font-medium">Expense</span>
        </div>
      </div>
    </div>
  );
}

// Activity Line Chart
export function ActivityLineChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="appointments"
            stroke="#41cbe2"
            strokeWidth={2}
            dot={{ fill: '#41cbe2', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#41cbe2' }}
          />
          <Line
            type="monotone"
            dataKey="walkIns"
            stroke="#ff6b6b"
            strokeWidth={2}
            dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#ff6b6b' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{value === 'appointments' ? 'Income' : 'Expenses'}</span>}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Top Medicines Bar Chart
export function PatientsBarChart({ data }: { data: any[] }) {
  // Ensure data is an array and has valid structure
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <Tooltip cursor={{ fill: 'rgba(65, 203, 226, 0.1)' }} />
          <Bar dataKey="sales" fill="#41cbe2" radius={[2, 2, 0, 0]} />
          <Bar dataKey="revenue" fill="#10b981" radius={[2, 2, 0, 0]} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{value === 'sales' ? 'Units Sold' : 'Revenue ($)'}</span>}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sales Revenue Chart
export function SalesRevenueChart({ data }: { data: any[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Inventory Status Chart
export function InventoryStatusChart({ data }: { data: any[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <Bar dataKey="inStock" fill="#10b981" radius={[2, 2, 0, 0]} />
          <Bar dataKey="lowStock" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          <Bar dataKey="outOfStock" fill="#ef4444" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}