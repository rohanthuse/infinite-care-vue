
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import { CarerDB } from "@/data/hooks/useBranchCarers";
import { useAdminSetPassword } from "@/hooks/useAdminSetPassword";
import { toast } from "sonner";

interface SetCarerPasswordDialogSafeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carer: CarerDB | null;
}

export const SetCarerPasswordDialogSafe = ({ open, onOpenChange, carer }: SetCarerPasswordDialogSafeProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [useGeneratedPassword, setUseGeneratedPassword] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const setPasswordMutation = useAdminSetPassword();

  // Generate a secure password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
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
    if (!carer) return;

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
      await setPasswordMutation.mutateAsync({
        staffId: carer.id,
        newPassword: password
      });

      // Reset form
      setPassword("");
      setConfirmPassword("");
      setGeneratedPassword("");
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
      console.error('Password set error:', error);
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

  const hasAuthAccount = carer?.invitation_accepted_at || carer?.first_login_completed;

  if (!carer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Set Password for {carer.first_name} {carer.last_name}
          </DialogTitle>
          <DialogDescription>
            Set a secure password for this carer's account. You can generate a random password or create a custom one with at least 8 characters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Carer Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{carer.first_name} {carer.last_name}</p>
                <p className="text-sm text-gray-600">{carer.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className={
                  hasAuthAccount 
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }>
                  {hasAuthAccount ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Has Account
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      No Account
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
                  className="text-blue-600"
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
                  className="text-blue-600"
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
                  className="font-mono bg-gray-50"
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
              <p className="text-xs text-gray-600">
                Make sure to securely share this password with the carer
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
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
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
              disabled={setPasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={
                setPasswordMutation.isPending || 
                !password || 
                password !== confirmPassword ||
                password.length < 8
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {setPasswordMutation.isPending ? 'Setting Password...' : 'Set Password'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
