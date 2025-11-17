import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce aggressive refetching for better performance
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      staleTime: 2 * 60 * 1000, // 2 minutes - faster updates for carer data
      gcTime: 5 * 60 * 1000, // 5 minutes - quicker cleanup
      retry: 1,
    },
    mutations: {
      retry: 1,
      // Prevent duplicate mutations
      networkMode: 'online',
    },
  },
});