'use client';

import { ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import LottieAnimation from '@/components/LottieAnimation';
import shareAnimation from '@/lotties/Share.json';

export default function SalesTestPage() {
  return (
    <div className="">
      {/* Header */}
      <div className="bg-[rgba(15,20,25,0.6)] backdrop-blur-sm border-b border-[rgba(255,255,255,0.08)] px-6 py-4 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-[#41cbe2] hover:text-[#5dd5ee] transition-colors duration-200">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-white text-xl font-semibold flex items-center space-x-2">
              <BarChart3 size={24} />
              <span>Sales Testing</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Lottie Animation Section */}
        <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 mb-6 shadow-lg shadow-black/20">
          <div className="flex items-center justify-center">
            <LottieAnimation 
              animationData={shareAnimation}
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20">
          <h2 className="text-white text-lg font-semibold mb-4">Sales Testing Environment</h2>
          <p className="text-gray-400 mb-4">
            This is a testing environment for sales functionality. Use this space to test new features and validate sales processes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Test Features</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Sales process validation</li>
                <li>• Payment method testing</li>
                <li>• Inventory integration</li>
                <li>• Report generation</li>
              </ul>
            </div>
            
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Testing Tools</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Mock data generation</li>
                <li>• Performance monitoring</li>
                <li>• Error simulation</li>
                <li>• Load testing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}