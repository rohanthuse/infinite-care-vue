import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useControlledDialog } from '@/hooks/useDialogManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, RefreshCw, Shield } from 'lucide-react';
import { useSetCarerPassword, useGenerateTemporaryPassword } from '@/hooks/useSetCarerPassword';
import { CarerDB } from '@/data/hooks/useBranchCarers';
import { toast } from 'sonner';

interface SetCarerPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carer: CarerDB | null;
}

export function SetCarerPasswordDialog({ open, onOpenChange, carer }: SetCarerPasswordDialogProps) {
  // Add controlled dialog integration
  const dialogId = `set-password-${carer?.id || 'new'}`;
  const controlledDialog = useControlledDialog(dialogId, open);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout>();
  const setPasswordMutation = useSetCarerPassword();
  const generatePasswordMutation = useGenerateTemporaryPassword();

  // Enhanced cleanup and focus management
  const resetForm = useCallback(() => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleGeneratePassword = async () => {
    try {
      const generatedPassword = await generatePasswordMutation.mutateAsync();
      setPassword(generatedPassword);
      setConfirmPassword(generatedPassword);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Sync with parent state and ensure proper cleanup
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (isSubmitting && newOpen === false) return; // Prevent closing while submitting
    
    controlledDialog.onOpenChange(newOpen);
    onOpenChange(newOpen);
    
    if (!newOpen) {
      resetForm();
    }
  }, [isSubmitting, controlledDialog, onOpenChange, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!carer || isSubmitting) return;
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await setPasswordMutation.mutateAsync({
        staffId: carer.id,
        password: password
      });
      
      resetForm();
      handleOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  // Force UI unlock function for comprehensive cleanup
  const forceUIUnlock = useCallback(() => {
    // Remove any stuck overlays
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay]');
    overlays.forEach(overlay => overlay.remove());
    
    // Remove aria-hidden and inert from any elements
    document.querySelectorAll('[aria-hidden="true"], [inert]').forEach(el => {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
    });
    
    // Aggressive body/html cleanup
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    document.documentElement.style.removeProperty('overflow');
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
    document.body.removeAttribute('data-scroll-locked');
    document.documentElement.removeAttribute('data-scroll-locked');
  }, []);

  const passwordStrength = getPasswordStrength(password);
  const strengthColor = passwordStrength < 2 ? 'bg-red-500' : passwordStrength < 4 ? 'bg-yellow-500' : 'bg-green-500';
  const strengthText = passwordStrength < 2 ? 'Weak' : passwordStrength < 4 ? 'Medium' : 'Strong';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        ref={dialogRef} 
        className="sm:max-w-md" 
        onCloseAutoFocus={() => setTimeout(forceUIUnlock, 50)}
        onEscapeKeyDown={() => {
          handleOpenChange(false);
          setTimeout(forceUIUnlock, 50);
        }}
        onPointerDownOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault(); // Prevent closing while submitting
          } else {
            handleOpenChange(false);
            setTimeout(forceUIUnlock, 50);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Set Password for {carer?.first_name} {carer?.last_name}
          </DialogTitle>
          <DialogDescription>
            Set a new password for this carer. Use a strong password with at least 8 characters including uppercase, lowercase, numbers, and symbols.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {password && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all ${strengthColor}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-600">{strengthText}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Password should contain at least 8 characters with uppercase, lowercase, numbers, and symbols
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600">Passwords do not match</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGeneratePassword}
              disabled={generatePasswordMutation.isPending}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generatePasswordMutation.isPending ? 'animate-spin' : ''}`} />
              Generate Secure Password
            </Button>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || setPasswordMutation.isPending || password !== confirmPassword || password.length < 8}
            >
              {(isSubmitting || setPasswordMutation.isPending) ? 'Setting Password...' : 'Set Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
