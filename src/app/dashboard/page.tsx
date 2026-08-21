'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DashboardView } from '@/components/DashboardView';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleNavigate = (view: string, id?: string) => {
      if (id) {
          router.push(`/solutions/${id}`);
      } else {
          router.push(view === 'home' ? '/' : `/${view}`);
      }
  };

  if (loading || !user) return null;
  return <DashboardView onNavigate={handleNavigate} />;
}
