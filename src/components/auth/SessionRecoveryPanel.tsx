import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Settings, CheckCircle, XCircle } from 'lucide-react';
import { CustomButton } from '@/components/ui/CustomButton';
import { toast } from 'sonner';
import { nuclearReset, repairSession, clearAllAuthData, debugAuthState } from '@/utils/authRecovery';

interface SessionRecoveryPanelProps {
  onRecoverySuccess?: () => void;
  showAdvanced?: boolean;
}

export const SessionRecoveryPanel: React.FC<SessionRecoveryPanelProps> = ({ 
  onRecoverySuccess,
  showAdvanced = false 
}) => {
  const [isRepairing, setIsRepairing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isNuclear, setIsNuclear] = useState(false);
  const [showDebugMode, setShowDebugMode] = useState(false);

  const handleRepairSession = async () => {
    setIsRepairing(true);
    try {
      console.log('[SessionRecoveryPanel] Starting session repair');
      const result = await repairSession();
      
      if (result.success) {
        toast.success('Session repaired', { description: result.message });
        onRecoverySuccess?.();
      } else {
        toast.error('Session repair failed', { description: result.message });
      }
    } catch (error) {
      console.error('[SessionRecoveryPanel] Repair session error:', error);
      toast.error('Session repair failed', { description: 'An unexpected error occurred' });
    } finally {
      setIsRepairing(false);
    }
  };

  const handleClearAuthData = async () => {
    setIsClearing(true);
    try {
      console.log('[SessionRecoveryPanel] Clearing auth data');
      await clearAllAuthData();
      toast.success('Authentication data cleared');
      onRecoverySuccess?.();
      
      // Slight delay before redirect to show success message
      setTimeout(() => {
        window.location.replace('/');
      }, 1000);
    } catch (error) {
      console.error('[SessionRecoveryPanel] Clear auth data error:', error);
      toast.error('Failed to clear auth data');
    } finally {
      setIsClearing(false);
    }
  };

  const handleNuclearReset = async () => {
    setIsNuclear(true);
    try {
      console.log('[SessionRecoveryPanel] Starting nuclear reset');
      toast.info('Performing complete reset...', { description: 'This may take a moment' });
      
      await nuclearReset();
      toast.success('Complete reset successful');
      onRecoverySuccess?.();
      
      // Force page reload after nuclear reset
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      console.error('[SessionRecoveryPanel] Nuclear reset error:', error);
      toast.error('Nuclear reset failed');
    } finally {
      setIsNuclear(false);
    }
  };

  const handleDebugAuth = async () => {
    try {
      console.log('[SessionRecoveryPanel] Running auth debug');
      await debugAuthState();
      toast.info('Debug information logged to console');
    } catch (error) {
      console.error('[SessionRecoveryPanel] Debug auth error:', error);
      toast.error('Debug failed');
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Session Recovery Tools
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            Having trouble signing in? Try these recovery options to fix authentication issues.
          </p>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <CustomButton
                onClick={handleRepairSession}
                disabled={isRepairing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                {isRepairing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Repair Session
              </CustomButton>

              <CustomButton
                onClick={handleClearAuthData}
                disabled={isClearing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                {isClearing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Clear Auth Data
              </CustomButton>

              {showAdvanced && (
                <CustomButton
                  onClick={handleNuclearReset}
                  disabled={isNuclear}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-100"
                >
                  {isNuclear ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Nuclear Reset
                </CustomButton>
              )}
            </div>

            {showAdvanced && (
              <div className="pt-2 border-t border-yellow-200">
                <div className="flex items-center gap-2">
                  <CustomButton
                    onClick={handleDebugAuth}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-yellow-600 hover:bg-yellow-100"
                  >
                    <Settings className="h-4 w-4" />
                    Debug Auth State
                  </CustomButton>
                  
                  <CustomButton
                    onClick={() => setShowDebugMode(!showDebugMode)}
                    variant="ghost"
                    size="sm"
                    className="text-yellow-600 hover:bg-yellow-100"
                  >
                    {showDebugMode ? 'Hide' : 'Show'} Advanced Options
                  </CustomButton>
                </div>

                {showDebugMode && (
                  <div className="mt-3 p-3 bg-yellow-100 rounded text-xs text-yellow-800">
                    <p className="font-medium mb-2">Recovery Options:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Repair Session:</strong> Fixes corrupted auth tokens</li>
                      <li>• <strong>Clear Auth Data:</strong> Removes authentication storage</li>
                      <li>• <strong>Nuclear Reset:</strong> Clears ALL browser data</li>
                      <li>• <strong>Debug Auth State:</strong> Logs detailed auth info</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-yellow-600">
            <p>
              If problems persist, try switching to an incognito/private browser window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};