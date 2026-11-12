import React from 'react';
import useSWR from 'swr';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../services/brgApi';
import { useAppStore } from '../store/appStore';
import type { ApiUser } from '../services/brgApi';
import type { User } from '../types';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const { data, error, isLoading } = useSWR<ApiUser>('brg-current-user', getCurrentUser, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
    dedupingInterval: 30_000,
  });

  React.useEffect(() => {
    if (data) setCurrentUser(data as User);
    if (error) setCurrentUser(null);
  }, [data, error, setCurrentUser]);

  if (isLoading) {
    return <main className="min-h-screen bg-[#07111F] text-slate-300 grid place-items-center" role="status">Checking secure session…</main>;
  }
  if (error || !data) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
};
