'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package } from 'lucide-react';

interface TopMedicinesProps {
  data: Array<{
    day: string;
    sales: number;
    revenue: number;
  }>;
}

export default function TopMedicines({ data }: TopMedicinesProps) {
  console.log('TopMedicines received data:', data);

  // Filter out medicines with no sales
  const filteredData = data.filter(item => item.sales > 0);

  console.log('TopMedicines filtered data:', filteredData);

  // If no data, show placeholder
  if (filteredData.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-[14.106px] flex items-center space-x-2">
            <TrendingUp size={16} />
            <span>Top Medicines</span>
          </h3>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Package className="mx-auto text-gray-500 mb-2" size={32} />
            <p className="text-gray-400 text-sm">No sales data available</p>
            <p className="text-gray-500 text-xs mt-1">Make some sales to see top medicines</p>
          </div>
        </div>
      </>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1f1b2c] border border-[rgba(255,255,255,0.2)] rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{`Medicine: ${label}`}</p>
          <p className="text-[#41cbe2]">{`Sales: ${payload[0].value} units`}</p>
          <p className="text-green-400">{`Revenue: ₹${payload[1]?.value?.toLocaleString('en-IN') || 0}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-[14.106px] flex items-center space-x-2">
          <TrendingUp size={16} />
          <span>Top Medicines</span>
        </h3>
        <div className="text-[rgba(255,255,255,0.75)] text-[12px]">
          Last 30 days
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(65, 203, 226, 0.1)' }} />
            <Bar
              dataKey="sales"
              fill="#41cbe2"
              radius={[2, 2, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top medicines list */}
      <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#41cbe2] scrollbar-track-[rgba(255,255,255,0.1)]">
        {filteredData.slice(0, 8).map((medicine) => (
          <div key={medicine.day} className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.05)] rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-[#41cbe2] rounded-full"></div>
              <span className="text-white text-sm font-medium">{medicine.day}</span>
            </div>
            <div className="text-right">
              <div className="text-white text-sm font-medium">{medicine.sales} units</div>
              <div className="text-green-400 text-xs">₹{medicine.revenue.toLocaleString('en-IN')}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}