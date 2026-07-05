import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ReactNode } from 'react';

interface SalesLayoutProps {
  children: ReactNode;
}

export default async function SalesLayout({ children }: SalesLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  // For now, just check for authentication - role checking can be added later
  return <>{children}</>;
}