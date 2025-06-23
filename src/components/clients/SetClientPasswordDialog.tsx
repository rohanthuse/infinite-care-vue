
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Copy, RefreshCw, User } from "lucide-react";
import { useAdminSetClientPassword } from "@/hooks/useAdminSetClientPassword";
import { useAdminSetClientAuth } from "@/hooks/useAdminSetClientAuth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SetClientPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const SetClientPasswordDialog: React.FC<SetClientPasswordDialogProps> = ({
  open,
  onOpenChange,
  client,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupAuthAccount, setSetupAuthAccount] = useState(true);
  
  const { session } = useAuth();
  const { toast } = useToast();
  const setClientPasswordMutation = useAdminSetClientPassword();
  const setClientAuthMutation = useAdminSetClientAuth();

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setPassword(newPassword);
  };

  const handleCopyPassword = async () => {
    if (password) {
      try {
        await navigator.clipboard.writeText(password);
        toast({
          title: "Copied",
          description: "Password copied to clipboard",
        });
      } catch (error) {
        console.error('Failed to copy password:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client || !session?.user?.id || !password.trim()) {
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (setupAuthAccount) {
        // Set up complete authentication account
        await setClientAuthMutation.mutateAsync({
          clientId: client.id,
          password: password.trim(),
          adminId: session.user.id,
        });
      } else {
        // Just set password in billing system
        await setClientPasswordMutation.mutateAsync({
          clientId: client.id,
          password: password.trim(),
          adminId: session.user.id,
        });
      }
      
      // Close dialog on success
      onOpenChange(false);
      setPassword('');
      setSetupAuthAccount(true);
    } catch (error) {
      console.error('Error setting client password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setPassword('');
    setShowPassword(false);
    setSetupAuthAccount(true);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Client Password & Authentication</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Client Details</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{client.first_name} {client.last_name}</p>
              <p className="text-sm text-gray-600">{client.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Authentication Setup</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="setupAuth"
                checked={setupAuthAccount}
                onChange={(e) => setSetupAuthAccount(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="setupAuth" className="text-sm text-gray-700">
                Set up complete authentication account (recommended)
              </label>
            </div>
            <p className="text-xs text-gray-500">
              {setupAuthAccount 
                ? "This will create or update the client's login account and enable portal access"
                : "This will only set the password in the billing system"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGeneratePassword}
                  title="Generate random password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                  disabled={!password}
                  title="Copy password"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !password.trim() || password.length < 8}
              >
                {isSubmitting ? (
                  setupAuthAccount ? "Setting up Authentication..." : "Setting Password..."
                ) : (
                  setupAuthAccount ? "Setup Authentication" : "Set Password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
