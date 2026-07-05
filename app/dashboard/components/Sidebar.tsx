'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ShoppingCart, Package, TrendingUp, MessageSquare, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="bg-[#0c1015] border-r border-[rgba(255,255,255,0.04)] w-[227px] h-screen fixed left-0 top-0 p-6 z-40">
            {/* Logo */}
            <div className="mb-8 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#141a20] border border-[#1f252b] rounded-xl flex items-center justify-center">
                        <img src="/logooo1-nobg.png" alt="PharmAide Logo" className="w-6 h-6 object-cover" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">PharmAide</span>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-2">
                <Link href="/dashboard" className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive('/dashboard') ? 'bg-[#141a20] border border-[#1f252b] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.02)]'}`}>
                    <BarChart3 size={18} />
                    <span className="font-medium">Dashboard</span>
                </Link>
                <Link href="/dashboard/sales" className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive('/dashboard/sales') ? 'bg-[#141a20] border border-[#1f252b] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.02)]'}`}>
                    <ShoppingCart size={18} />
                    <span>Sales</span>
                </Link>
                <Link href="/dashboard/inventory" className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive('/dashboard/inventory') ? 'bg-[#141a20] border border-[#1f252b] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.02)]'}`}>
                    <Package size={18} />
                    <span>Inventory</span>
                </Link>
                <Link href="/dashboard/tracking" className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive('/dashboard/tracking') ? 'bg-[#141a20] border border-[#1f252b] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.02)]'}`}>
                    <TrendingUp size={18} />
                    <span>Tracking</span>
                </Link>
                <Link href="/dashboard/messages" className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive('/dashboard/messages') ? 'bg-[#141a20] border border-[#1f252b] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.02)]'}`}>
                    <MessageSquare size={18} />
                    <span>Messages</span>
                </Link>
                {((session?.user as any)?.is_admin || (session?.user as any)?.role === 'Manager') && (
                    <Link href="/dashboard/settings" className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive('/dashboard/settings') ? 'bg-[#141a20] border border-[#1f252b] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.02)]'}`}>
                        <Settings size={18} />
                        <span>Settings</span>
                    </Link>
                )}
            </nav>

            {/* Logout */}
            <div className="absolute bottom-6 left-6 right-6">
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center space-x-3 text-gray-500 hover:text-red-300 p-3 hover:bg-red-500/5 transition-all duration-200 cursor-pointer rounded-lg"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
