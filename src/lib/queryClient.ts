import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce aggressive refetching for better performance
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});