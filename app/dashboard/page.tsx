'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { gsap } from 'gsap';
import MedicalChatbot from './components/MedicalChatbot';
import Calendar from './components/Calendar';
import AddMedicine from './components/AddMedicine';
import Notifications from './components/Notifications';
import TopMedicines from './components/TopMedicines';
import { IncomeChart, ActivityLineChart } from './components/EnhancedCharts';
import { useDashboardData } from './hooks/useDashboardData';
import { User, Package, DollarSign, AlertTriangle, ArrowUp } from 'lucide-react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { data: dashboardData, loading } = useDashboardData();

  // All hooks must be called before any conditional returns
  useEffect(() => {
    // Only run animations when not loading
    if (status === 'loading') return;

    // GSAP fade-in animations
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    }

    // Stagger animation for cards
    cardsRef.current.forEach((card, index) => {
      if (card) {
        gsap.fromTo(card,
          {
            opacity: 0,
            y: 30,
            scale: 0.95
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            delay: index * 0.1,
            ease: "power2.out"
          }
        );
      }
    });
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0d12]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b7280]"></div>
      </div>
    );
  }

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  const handleMedicineAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div ref={containerRef} className="bg-[#0a0d12] min-h-screen">
      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 p-4 md:p-6 transition-all duration-300 ${isNotificationsOpen ? 'lg:mr-[352px]' : 'lg:mr-6'}`}>
          {/* Header */}
          <div className="bg-[rgba(15,20,25,0.6)] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-xl mb-6 px-4 py-4 md:px-6 shadow-lg shadow-black/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-6">
                <h2 className="text-white text-xl font-semibold">Dashboard</h2>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center w-full md:w-auto space-y-3 md:space-y-0 md:space-x-6">
                <div className="text-white text-sm font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })} • {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
                <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
                  <div className="flex items-center space-x-3">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="w-9 h-9 rounded-full border-2 border-[rgba(255,255,255,0.2)]"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-[#1a2332] border border-[#2a3441] rounded-full flex items-center justify-center">
                        <User size={18} className="text-white" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-medium">{session?.user?.name || 'User'}</span>
                      {((session?.user as any)?.role || (session?.user as any)?.is_admin) && (
                        <span className="text-xs text-gray-400">
                          {(session?.user as any)?.is_admin ? 'Manager' : (session?.user as any)?.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            {/* Total Revenue */}
            <div ref={addToRefs} className="bg-[#171f34] border border-[rgba(255,255,255,0.5)] rounded-[5px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[rgba(255,255,255,0.75)] text-sm">Total Revenue</p>
                  <p className="text-white text-2xl font-bold">₹{dashboardData.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-green-400 text-xs mt-1">+12.5% from last month</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-full">
                  <DollarSign className="text-green-400" size={24} />
                </div>
              </div>
            </div>

            {/* Total Sales */}
            <div ref={addToRefs} className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[rgba(255,255,255,0.75)] text-sm">Total Sales</p>
                  <p className="text-white text-2xl font-bold">{dashboardData.totalSales}</p>
                  <p className="text-blue-400 text-xs mt-1">+8.2% from last month</p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <ArrowUp className="text-blue-400" size={24} />
                </div>
              </div>
            </div>

            {/* Total Medicines */}
            <div ref={addToRefs} className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[rgba(255,255,255,0.75)] text-sm">Total Medicines</p>
                  <p className="text-white text-2xl font-bold">{dashboardData.totalMedicines}</p>
                  <p className="text-purple-400 text-xs mt-1">Active inventory</p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-full">
                  <Package className="text-purple-400" size={24} />
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            <div ref={addToRefs} className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[rgba(255,255,255,0.75)] text-sm">Low Stock Items</p>
                  <p className="text-white text-2xl font-bold">{dashboardData.lowStockCount}</p>
                  <p className="text-red-400 text-xs mt-1">Requires attention</p>
                </div>
                <div className="bg-red-500/20 p-3 rounded-full">
                  <AlertTriangle className="text-red-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Income Chart */}
            <div ref={addToRefs} className="col-span-1 lg:col-span-4 bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">Income Overview</h3>
                <div className="text-[rgba(255,255,255,0.75)] text-xs">This Month</div>
              </div>
              <div className="flex-1 flex flex-col">
                {dashboardData.incomeData ? (
                  <IncomeChart data={dashboardData.incomeData} />
                ) : (
                  <div className="flex items-center justify-center flex-1 text-gray-400">
                    Loading chart data...
                  </div>
                )}
              </div>
            </div>

            {/* Activity Chart */}
            <div ref={addToRefs} className="col-span-1 lg:col-span-8 bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">Sales Activity</h3>
                <div className="text-[rgba(255,255,255,0.75)] text-xs">Last 6 months</div>
              </div>
              {dashboardData.activityData && Array.isArray(dashboardData.activityData) ? (
                <ActivityLineChart data={dashboardData.activityData} />
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  Loading chart data...
                </div>
              )}
              <div className="flex items-center justify-center mt-4 space-x-6">
              </div>
            </div>

            {/* Calendar */}
            <div ref={addToRefs} className="col-span-1 lg:col-span-6 bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 flex flex-col min-h-[450px]">
              <div className="mb-4 flex justify-center">
                <h3 className="text-white font-semibold text-xl">Calendar</h3>
              </div>
              <div className="flex-1 min-h-[380px]">
                <Calendar key={refreshTrigger} />
              </div>
            </div>

            {/* Top Medicines Chart */}
            <div ref={addToRefs} className="col-span-1 lg:col-span-6 bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 flex flex-col">
              <div className="flex-1">
                {dashboardData.patientsData && Array.isArray(dashboardData.patientsData) && dashboardData.patientsData.length > 0 ? (
                  <TopMedicines data={dashboardData.patientsData} />
                ) : (
                  <TopMedicines data={[
                    { day: 'Paracetamol', sales: 15, revenue: 31125 },
                    { day: 'Ibuprofen', sales: 12, revenue: 24900 },
                    { day: 'Amoxicillin', sales: 8, revenue: 16600 },
                    { day: 'Aspirin', sales: 6, revenue: 12450 },
                    { day: 'Omeprazole', sales: 4, revenue: 8300 }
                  ]} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Notifications */}
        <Notifications
          key={refreshTrigger}
          isOpen={isNotificationsOpen}
          onToggle={() => setIsNotificationsOpen(!isNotificationsOpen)}
        />
      </div>

      {/* Medical Chatbot */}
      <MedicalChatbot />

      {/* Add Medicine Modal */}
      <AddMedicine
        isOpen={isAddMedicineOpen}
        onClose={() => setIsAddMedicineOpen(false)}
        onMedicineAdded={handleMedicineAdded}
      />
    </div>
  );
}