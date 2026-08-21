'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EducatorCenterView } from '@/components/EducatorCenterView';

export default function EducatorCenterPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.accountType !== 'educator') {
        router.push('/dashboard');
      }
    }
  }, [user, profile, loading, router]);

  if (loading || !user || profile?.accountType !== 'educator') return null;

  return <EducatorCenterView />;
}
