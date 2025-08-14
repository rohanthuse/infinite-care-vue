import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import { useResetSystemUserPassword } from "@/hooks/useResetSystemUserPassword";
import { toast } from "sonner";

interface SystemUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
}

interface SetSystemUserPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SystemUser | null;
}

export const SetSystemUserPasswordDialog = ({ open, onOpenChange, user }: SetSystemUserPasswordDialogProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [useGeneratedPassword, setUseGeneratedPassword] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const resetPasswordMutation = useResetSystemUserPassword();

  // Generate a secure password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 14; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(result);
    setPassword(result);
    setConfirmPassword(result);
  };

  React.useEffect(() => {
    if (open && useGeneratedPassword) {
      generatePassword();
    }
  }, [open, useGeneratedPassword]);

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    if (!password) {
      toast.error("Password is required");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        userId: user.id,
        newPassword: password
      });

      // Reset form
      setPassword("");
      setConfirmPassword("");
      setGeneratedPassword("");
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
      console.error('Password reset error:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const hasLoggedIn = user?.last_login_at;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Reset Password for {user.first_name} {user.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.first_name} {user.last_name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Role: {user.role === 'super_admin' ? 'Super Admin' : 
                         user.role === 'tenant_manager' ? 'Tenant Manager' :
                         user.role === 'analytics_viewer' ? 'Analytics Viewer' : 'Support Admin'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline" className={
                  hasLoggedIn 
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                }>
                  {hasLoggedIn ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Has Logged In
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Never Logged In
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* Password Type Selection */}
          <div className="space-y-3">
            <Label>Password Type</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={useGeneratedPassword}
                  onChange={() => {
                    setUseGeneratedPassword(true);
                    generatePassword();
                  }}
                  className="text-primary"
                />
                <span className="text-sm">Generate secure password (recommended)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={!useGeneratedPassword}
                  onChange={() => {
                    setUseGeneratedPassword(false);
                    setPassword("");
                    setConfirmPassword("");
                    setGeneratedPassword("");
                  }}
                  className="text-primary"
                />
                <span className="text-sm">Set custom password</span>
              </label>
            </div>
          </div>

          {/* Generated Password Display */}
          {useGeneratedPassword && generatedPassword && (
            <div className="space-y-2">
              <Label>Generated Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedPassword}
                  readOnly
                  className="font-mono bg-muted"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedPassword)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                >
                  Regenerate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure to securely share this password with the system user
              </p>
            </div>
          )}

          {/* Custom Password Input */}
          {!useGeneratedPassword && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">New Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {password && (
                <div className="text-xs space-y-1">
                  <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-green-600' : 'bg-red-600'}`} />
                    At least 8 characters
                  </div>
                  {confirmPassword && (
                    <div className={`flex items-center gap-1 ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                      <div className={`w-1 h-1 rounded-full ${password === confirmPassword ? 'bg-green-600' : 'bg-red-600'}`} />
                      Passwords match
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={resetPasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={
                resetPasswordMutation.isPending || 
                !password || 
                password !== confirmPassword ||
                password.length < 8
              }
              className="bg-primary hover:bg-primary/90"
            >
              {resetPasswordMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};