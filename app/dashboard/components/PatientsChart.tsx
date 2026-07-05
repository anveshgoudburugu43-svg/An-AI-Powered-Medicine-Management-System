'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', male: 280, female: 30 },
  { name: 'Tue', male: 170, female: 160 },
  { name: 'Wed', male: 200, female: 50 },
  { name: 'Thur', male: 170, female: 130 },
  { name: 'Fri', male: 350, female: 160 },
  { name: 'Sat', male: 90, female: 80 },
  { name: 'Sun', male: 150, female: 230 },
];

export default function PatientsChart() {
  return (
    <div>
      <div className="h-64 relative" style={{ minHeight: '256px', minWidth: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              domain={[0, 400]}
              ticks={[0, 100, 200, 300, 400]}
            />
            <Bar 
              dataKey="male" 
              fill="#41cbe2" 
              radius={[2, 2, 0, 0]}
              barSize={20}
            />
            <Bar 
              dataKey="female" 
              fill="#ff6343" 
              radius={[2, 2, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#41cbe2] rounded-full"></div>
          <span className="text-white text-[12.305px]">Male</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#ff6343] rounded-full"></div>
          <span className="text-white text-[12.305px]">Female</span>
        </div>
      </div>
    </div>
  );
}