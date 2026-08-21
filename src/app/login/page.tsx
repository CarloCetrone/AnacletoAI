'use client';
import { useRouter } from 'next/navigation';
import { LoginView } from '@/components/LoginView';

export default function LoginPage() {
  const router = useRouter();
  const handleNavigate = (view: string) => {
     router.push(view === 'home' ? '/' : `/${view}`);
  };
  return <LoginView onNavigate={handleNavigate} />;
}
