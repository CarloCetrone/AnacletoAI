'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiPlaygroundView } from '@/components/ApiPlaygroundView';

export default function DeveloperCenterPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.accountType !== 'developer') {
        router.push('/dashboard');
      }
    }
  }, [user, profile, loading, router]);

  if (loading || !user || profile?.accountType !== 'developer') return null;

  return <ApiPlaygroundView />;
}
