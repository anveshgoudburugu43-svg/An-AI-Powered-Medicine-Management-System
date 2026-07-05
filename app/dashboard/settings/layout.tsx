import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCurrentUser } from '@/lib/auth';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const user = await getCurrentUser();
  
  // Only managers can access settings
  if (!user || (!user.is_admin && user.role !== 'Manager')) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}