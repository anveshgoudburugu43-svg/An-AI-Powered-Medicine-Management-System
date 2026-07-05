'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', appointments: 65, walkIn: 25 },
  { name: 'Feb', appointments: 40, walkIn: 30 },
  { name: 'Mar', appointments: 55, walkIn: 20 },
  { name: 'Apr', appointments: 35, walkIn: 15 },
  { name: 'May', appointments: 65, walkIn: 35 },
];

export default function ActivityChart() {
  return (
    <div>
      <div className="h-48 relative" style={{ minHeight: '192px', minWidth: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="none" 
              stroke="rgba(255,255,255,0.1)" 
              horizontal={true}
              vertical={true}
            />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'white', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'white', fontSize: 12 }}
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
            />
            <Line 
              type="monotone" 
              dataKey="appointments" 
              stroke="#41cbe2" 
              strokeWidth={2}
              dot={{ fill: '#41cbe2', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#41cbe2' }}
            />
            <Line 
              type="monotone" 
              dataKey="walkIn" 
              stroke="#ff6343" 
              strokeWidth={2}
              dot={{ fill: '#ff6343', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#ff6343' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#41cbe2] rounded-full"></div>
          <span className="text-white text-[12.305px]">Appointments</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#ff6343] rounded-full"></div>
          <span className="text-white text-[12.305px]">Walk in patients</span>
        </div>
      </div>
    </div>
  );
}