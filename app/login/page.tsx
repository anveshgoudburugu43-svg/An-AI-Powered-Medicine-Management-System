'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Pill, ShieldCheck, TrendingUp, Package } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0e13] via-[#0f1419] to-[#1a1f2e]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#41cbe2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e13] via-[#0f1419] to-[#1a1f2e] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left space-y-6"
        >
          <div className="flex items-center justify-center lg:justify-start space-x-3">
            <div className="bg-gradient-to-br from-[#41cbe2] to-[#2a9fb8] p-3 rounded-2xl">
              <Pill size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">PharmAid</h1>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
            Smart Pharmacy Management System
          </h2>

          <p className="text-gray-400 text-lg">
            Streamline your pharmacy operations with AI-powered inventory management, 
            sales tracking, and intelligent predictions.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start space-x-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <ShieldCheck className="text-green-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Secure & Reliable</h3>
                <p className="text-gray-400 text-sm">Enterprise-grade security for your data</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <TrendingUp className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold">AI-Powered Insights</h3>
                <p className="text-gray-400 text-sm">Smart predictions for inventory management</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Package className="text-purple-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Complete Control</h3>
                <p className="text-gray-400 text-sm">Manage inventory, sales, and analytics</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Box */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full"
        >
          <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.1)] rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
              <p className="text-gray-400">Sign in to access your dashboard</p>
            </div>

            <div className="space-y-4">
              {/* Google Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </motion.button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] text-gray-400">
                    Secure authentication
                  </span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-400">
                <p>By signing in, you agree to our</p>
                <div className="flex items-center justify-center space-x-2 mt-1">
                  <a href="#" className="text-[#41cbe2] hover:underline">Terms of Service</a>
                  <span>and</span>
                  <a href="#" className="text-[#41cbe2] hover:underline">Privacy Policy</a>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <ShieldCheck size={16} className="text-green-400" />
                <span>Protected by enterprise-grade security</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}