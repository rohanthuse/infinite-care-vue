import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ThirdPartySession {
  sessionToken: string;
  thirdPartyUser: any;
  branchInfo: any;
  accessScope: string;
  accessExpiresAt?: string;
}

export const useThirdPartySession = () => {
  const [session, setSession] = useState<ThirdPartySession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = () => {
    try {
      const sessionData = localStorage.getItem('thirdPartySession');
      if (!sessionData) {
        setSession(null);
        setLoading(false);
        return;
      }

      const parsedSession = JSON.parse(sessionData);
      
      // Check if session is expired
      if (parsedSession.accessExpiresAt) {
        const expiryDate = new Date(parsedSession.accessExpiresAt);
        if (new Date() > expiryDate) {
          clearSession();
          toast.error('Your third-party access has expired');
          return;
        }
      }

      setSession(parsedSession);
    } catch (error) {
      console.error('Error loading third-party session:', error);
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem('thirdPartySession');
    setSession(null);
  };

  const isSessionActive = () => {
    if (!session) return false;
    
    if (session.accessExpiresAt) {
      const expiryDate = new Date(session.accessExpiresAt);
      return new Date() <= expiryDate;
    }
    
    return true;
  };

  const getTimeRemaining = () => {
    if (!session?.accessExpiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(session.accessExpiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Less than 1 hour';
  };

  const signOut = () => {
    clearSession();
    navigate('/login');
  };

  return {
    session,
    loading,
    isSessionActive: isSessionActive(),
    timeRemaining: getTimeRemaining(),
    signOut,
    clearSession
  };
};