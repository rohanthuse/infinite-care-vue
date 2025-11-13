import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce aggressive refetching for better performance
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      staleTime: 10 * 60 * 1000, // 10 minutes - increased for visit data
      gcTime: 15 * 60 * 1000, // 15 minutes
      retry: 1,
    },
    mutations: {
      retry: 1,
      // Prevent duplicate mutations
      networkMode: 'online',
    },
  },
});