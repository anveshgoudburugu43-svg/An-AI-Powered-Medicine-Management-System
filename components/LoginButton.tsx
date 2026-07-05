'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { LogIn, LogOut, User } from 'lucide-react';

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#171f34] border border-[#41cbe2]/50 px-6 text-[#41cbe2] mx-auto">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#41cbe2]"></div>
        Loading...
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex flex-col gap-4 items-center">
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {session.user?.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {session.user?.email}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-red-500 px-6 text-white transition-colors hover:bg-red-600 mx-auto"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#41cbe2] px-6 text-white transition-colors hover:bg-[#35a8c0] mx-auto font-medium shadow-lg shadow-[#41cbe2]/20"
    >
      <div className="bg-white rounded-full p-1 flex items-center justify-center">
        <svg className="w-3 h-3" viewBox="0 0 24 24">
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
      </div>
      <span className="text-sm font-semibold tracking-wide">Sign in</span>
    </button>
  );
}