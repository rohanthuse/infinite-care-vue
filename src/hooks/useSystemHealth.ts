import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemHealthMetrics {
  isHealthy: boolean;
  dbConnected: boolean;
  realtimeConnected: boolean;
  lastHealthCheck: Date;
  failureCount: number;
  degradedMode: boolean;
}

export const useSystemHealth = () => {
  const [metrics, setMetrics] = useState<SystemHealthMetrics>({
    isHealthy: true,
    dbConnected: true,
    realtimeConnected: true,
    lastHealthCheck: new Date(),
    failureCount: 0,
    degradedMode: false,
  });
  
  const healthCheckInterval = useRef<NodeJS.Timeout>();
  const failureCountRef = useRef(0);
  const maxFailures = 3;
  
  const performHealthCheck = useCallback(async () => {
    try {
      // Test basic database connectivity
      const { error: dbError } = await Promise.race([
        supabase.from('organizations').select('id').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DB timeout')), 5000)
        )
      ]) as any;
      
      const dbConnected = !dbError;
      
      // Test realtime connectivity (simplified check)
      const realtimeConnected = supabase.realtime.isConnected();
      
      // More lenient health check - only consider degraded if both DB and realtime fail
      const isHealthy = dbConnected;
      
      if (dbConnected) {
        failureCountRef.current = 0;
      } else {
        failureCountRef.current++;
      }
      
      // Only show degraded mode for serious DB issues, not realtime hiccups
      const degradedMode = failureCountRef.current >= maxFailures;
      
      setMetrics({
        isHealthy,
        dbConnected,
        realtimeConnected,
        lastHealthCheck: new Date(),
        failureCount: failureCountRef.current,
        degradedMode,
      });
      
    } catch (error) {
      console.error('Health check failed:', error);
      failureCountRef.current++;
      
      setMetrics(prev => ({
        ...prev,
        isHealthy: false,
        dbConnected: false,
        lastHealthCheck: new Date(),
        failureCount: failureCountRef.current,
        degradedMode: true,
      }));
    }
  }, []);
  
  useEffect(() => {
    // Initial health check
    performHealthCheck();
    
    // Set up periodic health checks (every 30 seconds)
    healthCheckInterval.current = setInterval(performHealthCheck, 30000);
    
    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }
    };
  }, [performHealthCheck]);
  
  const forceHealthCheck = useCallback(() => {
    performHealthCheck();
  }, [performHealthCheck]);
  
  const resetHealth = useCallback(() => {
    failureCountRef.current = 0;
    performHealthCheck();
  }, [performHealthCheck]);
  
  return {
    ...metrics,
    forceHealthCheck,
    resetHealth,
  };
};