'use client';

import Sidebar from './components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-[#0a0d12] min-h-screen flex">
            <Sidebar />
            <div className="flex-1 ml-[227px]">
                {children}
            </div>
        </div>
    );
}
