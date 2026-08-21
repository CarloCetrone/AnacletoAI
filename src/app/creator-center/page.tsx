'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CreatorCenterView } from '@/components/CreatorCenterView';

export default function CreatorCenterPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.accountType !== 'creator') {
        router.push('/dashboard');
      }
    }
  }, [user, profile, loading, router]);

  if (loading || !user || profile?.accountType !== 'creator') return null;

  return <CreatorCenterView />;
}
