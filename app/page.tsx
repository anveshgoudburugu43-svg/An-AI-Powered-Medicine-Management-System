'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TrendingUp, Package, Layers, FileCode, Palette, Database, Shield, Sparkles, Brain, Bell, RefreshCcw, BarChart3, Bot, Camera, Upload, Cpu, Zap } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect to dashboard if user is already logged in
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-[#1f1b2c] font-sans flex flex-col">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-4 py-4 md:px-8 md:py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logooo1.png" alt="PharmAide Logo" className="w-10 h-10 object-cover rounded-xl shadow-lg shadow-[#41cbe2]/10" />
          <h1 className="text-2xl font-bold text-white tracking-tight">PharmAide</h1>
        </div>
        <div>
          <Link 
            href="/login"
            className="bg-[#41cbe2] hover:bg-[#2a9fb8] text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Pharmacy Inventory,
            <br />
            <span className="text-[#41cbe2]">On Autopilot.</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Say goodbye to expired stock and manual counting. Our AI-driven system predicts what you need, when you need it.
          </p>
        </div>

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 w-full max-w-5xl">
          {/* Feature 1: Intelligent Forecasting (Large) */}
          <div className="md:col-span-2 bg-[#171f34] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 md:p-8 hover:bg-[#1c2640] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Brain size={120} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-lg bg-[#41cbe2]/10 flex items-center justify-center mb-6">
                <Brain className="text-[#41cbe2]" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Intelligent Forecasting</h3>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                AI that learns from your sales history to predict next month's stock needs.
              </p>
            </div>
          </div>

          {/* Feature 2: Expiry Alerts (Small) */}
          <div className="bg-[#171f34] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 md:p-8 hover:bg-[#1c2640] transition-all group">
            <div className="w-12 h-12 rounded-lg bg-[#cceff6]/10 flex items-center justify-center mb-6">
              <Bell className="text-[#41cbe2]" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Expiry Alerts</h3>
            <p className="text-gray-400">
              Get notified 30, 60, and 90 days before medicines expire.
            </p>
          </div>

          {/* Feature 3: Smart Reordering (Small) */}
          <div className="bg-[#171f34] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 md:p-8 hover:bg-[#1c2640] transition-all group">
            <div className="w-12 h-12 rounded-lg bg-[#41cbe2]/10 flex items-center justify-center mb-6">
              <RefreshCcw className="text-[#41cbe2]" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Smart Reordering</h3>
            <p className="text-gray-400">
              Auto-generated purchase orders based on real-time stock levels.
            </p>
          </div>

          {/* Feature 4: Waste Analytics (Large) */}
          <div className="md:col-span-2 bg-[#171f34] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 md:p-8 hover:bg-[#1c2640] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart3 size={120} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-lg bg-[#41cbe2]/10 flex items-center justify-center mb-6">
                <BarChart3 className="text-[#41cbe2]" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Waste Analytics</h3>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Visual dashboards tracking how much money you've saved by reducing waste.
              </p>
            </div>
          </div>

          {/* Feature 5: AI Inventory Assistant (Large) */}
          <div className="md:col-span-2 bg-[#171f34] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 md:p-8 hover:bg-[#1c2640] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Bot size={120} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-lg bg-[#41cbe2]/10 flex items-center justify-center mb-6">
                <Bot className="text-[#41cbe2]" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Inventory Chat Assistant</h3>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                A context-aware chatbot that queries your live stock data to provide instant, personalized answers to your inventory questions.
              </p>
            </div>
          </div>

          {/* Feature 6: Image-Based Stocking (Small) */}
          <div className="bg-[#171f34] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 md:p-8 hover:bg-[#1c2640] transition-all group">
            <div className="w-12 h-12 rounded-lg bg-[#cceff6]/10 flex items-center justify-center mb-6">
              <Camera className="text-[#41cbe2]" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Image-Based Stocking</h3>
            <p className="text-gray-400">
              Snap a photo of any medicine packaging to automatically extract drug names and expiry dates for instant, error-free entry.
            </p>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="w-full max-w-5xl mb-16 md:mb-24">
          <h3 className="text-3xl font-bold text-white text-center mb-12 md:mb-16">How It Works</h3>
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-6 md:p-8">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-6 md:p-8 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#41cbe2]/20 via-[#41cbe2]/50 to-[#41cbe2]/20 -z-10"></div>

            {/* Step 1: Connect */}
            <div className="flex flex-col items-center text-center max-w-xs relative bg-[#1f1b2c] px-4">
              <div className="w-16 h-16 rounded-full bg-[#171f34] border border-[#41cbe2]/30 flex items-center justify-center mb-6 shadow-lg shadow-[#41cbe2]/20">
                <Upload className="text-[#41cbe2]" size={32} />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">1. Connect</h4>
              <p className="text-gray-400 leading-relaxed">
                Upload your existing inventory and sales records.
              </p>
            </div>

            {/* Step 2: Analyze */}
            <div className="flex flex-col items-center text-center max-w-xs relative bg-[#1f1b2c] px-4">
              <div className="w-16 h-16 rounded-full bg-[#171f34] border border-[#41cbe2]/30 flex items-center justify-center mb-6 shadow-lg shadow-[#41cbe2]/20">
                <Cpu className="text-[#41cbe2]" size={32} />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">2. Analyze</h4>
              <p className="text-gray-400 leading-relaxed">
                Our ML model analyses the expiry dates, product categories and sales patterns.
              </p>
            </div>

            {/* Step 3: Optimize */}
            <div className="flex flex-col items-center text-center max-w-xs relative bg-[#1f1b2c] px-4">
              <div className="w-16 h-16 rounded-full bg-[#171f34] border border-[#41cbe2]/30 flex items-center justify-center mb-6 shadow-lg shadow-[#41cbe2]/20">
                <Zap className="text-[#41cbe2]" size={32} />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">3. Optimize</h4>
              <p className="text-gray-400 leading-relaxed">
                Receive actionable insights on what to stock up on and what to clear out.
              </p>
            </div>
          </div>
        </div>

        {/* Tech Stack Section */}
        <div className="mb-12 text-center w-full max-w-4xl">
          <h3 className="text-2xl font-bold text-white mb-8">Built with Modern Technologies</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-[#171f34] border border-[rgba(255,255,255,0.05)] rounded-lg p-4 flex flex-col items-center hover:bg-[#1c2640] transition-colors">
              <Layers className="text-[#41cbe2] mb-2" size={24} />
              <span className="text-white font-medium">Next.js 16</span>
              <span className="text-gray-500 text-xs">App Router</span>
            </div>
            <div className="bg-[#171f34] border border-[rgba(255,255,255,0.05)] rounded-lg p-4 flex flex-col items-center hover:bg-[#1c2640] transition-colors">
              <FileCode className="text-[#41cbe2] mb-2" size={24} />
              <span className="text-white font-medium">TypeScript</span>
              <span className="text-gray-500 text-xs">Type Safety</span>
            </div>
            <div className="bg-[#171f34] border border-[rgba(255,255,255,0.05)] rounded-lg p-4 flex flex-col items-center hover:bg-[#1c2640] transition-colors">
              <Palette className="text-[#41cbe2] mb-2" size={24} />
              <span className="text-white font-medium">Tailwind CSS 4</span>
              <span className="text-gray-500 text-xs">Styling</span>
            </div>
            <div className="bg-[#171f34] border border-[rgba(255,255,255,0.05)] rounded-lg p-4 flex flex-col items-center hover:bg-[#1c2640] transition-colors">
              <Database className="text-[#41cbe2] mb-2" size={24} />
              <span className="text-white font-medium">Supabase</span>
              <span className="text-gray-500 text-xs">Database</span>
            </div>
            <div className="bg-[#171f34] border border-[rgba(255,255,255,0.05)] rounded-lg p-4 flex flex-col items-center hover:bg-[#1c2640] transition-colors">
              <Shield className="text-[#41cbe2] mb-2" size={24} />
              <span className="text-white font-medium">NextAuth.js</span>
              <span className="text-gray-500 text-xs">Authentication</span>
            </div>
            <div className="bg-[#171f34] border border-[rgba(255,255,255,0.05)] rounded-lg p-4 flex flex-col items-center hover:bg-[#1c2640] transition-colors">
              <Sparkles className="text-[#41cbe2] mb-2" size={24} />
              <span className="text-white font-medium">Google Gemini</span>
              <span className="text-gray-500 text-xs">AI Intelligence</span>
            </div>
          </div>
        </div>

        {/* Lottie Animation Section */}
        <div className="w-full max-w-2xl mb-16 flex flex-col items-center">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Experience the Future of Pharmacy Management</h3>
          <div className="w-full max-w-md">
            <DotLottieReact
              src="https://lottie.host/52e6ac11-c2f5-4295-aea5-1a02952cd0a3/3dmJMEYjV6.lottie"
              loop
              autoplay
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full mt-16 pt-8 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
            <div className="flex items-center gap-6">
              <span>© 2025 PharmAide</span>
              <a href="#" className="hover:text-[#41cbe2] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#41cbe2] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#41cbe2] transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Shield size={14} />
              <span>Secure, HIPAA-compliant</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
