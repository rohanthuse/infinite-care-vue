import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Edit, Trash2, Star, Save, X, Loader2, MapPin, Home, Building2, AlertCircle 
} from 'lucide-react';
import { 
  useClientAddresses, 
  useCreateClientAddress, 
  useUpdateClientAddress, 
  useDeleteClientAddress,
  useSetDefaultAddress,
  ClientAddress,
  ClientAddressInput
} from '@/hooks/useClientAddresses';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClientAddressSectionProps {
  clientId: string;
  legacyAddress?: string;
  legacyPinCode?: string;
}

const ADDRESS_LABELS = ['Home', 'Work', 'Respite', 'Holiday', 'Other'];
const COUNTRIES = ['United Kingdom', 'Ireland', 'United States', 'Canada', 'Australia'];

const emptyFormData = {
  address_label: 'Home',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state_county: '',
  postcode: '',
  country: 'United Kingdom',
  is_default: false,
};

export const ClientAddressSection: React.FC<ClientAddressSectionProps> = ({
  clientId,
  legacyAddress,
  legacyPinCode,
}) => {
  const { data: addresses = [], isLoading } = useClientAddresses(clientId);
  const createMutation = useCreateClientAddress();
  const updateMutation = useUpdateClientAddress();
  const deleteMutation = useDeleteClientAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [isSaving, setIsSaving] = useState(false);

  const getLabelIcon = (label: string) => {
    switch (label?.toLowerCase()) {
      case 'home': return <Home className="h-4 w-4" />;
      case 'work': return <Building2 className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const handleAddNew = () => {
    setFormData({ ...emptyFormData, is_default: addresses.length === 0 });
    setIsAddingNew(true);
    setEditingId(null);
  };

  const handleEdit = (address: ClientAddress) => {
    setFormData({
      address_label: address.address_label || 'Home',
      address_line_1: address.address_line_1 || '',
      address_line_2: address.address_line_2 || '',
      city: address.city || '',
      state_county: address.state_county || '',
      postcode: address.postcode || '',
      country: address.country || 'United Kingdom',
      is_default: address.is_default || false,
    });
    setEditingId(address.id);
    setIsAddingNew(false);
  };

  const handleCancel = () => {
    setFormData(emptyFormData);
    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.address_line_1 || !formData.city || !formData.postcode) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
          client_id: clientId,
        });
        toast.success('Address updated successfully');
      } else {
        await createMutation.mutateAsync({
          ...formData,
          client_id: clientId,
        } as ClientAddressInput);
        toast.success('Address added successfully');
      }
      handleCancel();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await deleteMutation.mutateAsync({ id: deleteConfirmId, clientId });
      toast.success('Address deleted successfully');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultMutation.mutateAsync({ id: addressId, clientId });
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default address');
    }
  };

  const formatAddress = (addr: ClientAddress) => {
    const parts = [
      addr.address_line_1,
      addr.address_line_2,
      addr.city,
      addr.state_county,
      addr.postcode,
      addr.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <Card className="p-4 border border-border shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  const renderAddressForm = () => (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address_label">Address Label</Label>
          <Select 
            value={formData.address_label} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, address_label: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select label" />
            </SelectTrigger>
            <SelectContent>
              {ADDRESS_LABELS.map(label => (
                <SelectItem key={label} value={label}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Select 
            value={formData.country} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address_line_1">Address Line 1 <span className="text-destructive">*</span></Label>
          <Input
            id="address_line_1"
            value={formData.address_line_1}
            onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
            placeholder="e.g., 123 Main Street, Apartment 4B"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address_line_2">Address Line 2</Label>
          <Input
            id="address_line_2"
            value={formData.address_line_2}
            onChange={(e) => setFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
            placeholder="Optional additional address details"
          />
        </div>
        <div>
          <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="e.g., London"
          />
        </div>
        <div>
          <Label htmlFor="state_county">State / County</Label>
          <Input
            id="state_county"
            value={formData.state_county}
            onChange={(e) => setFormData(prev => ({ ...prev, state_county: e.target.value }))}
            placeholder="e.g., Greater London"
          />
        </div>
        <div>
          <Label htmlFor="postcode">Postcode <span className="text-destructive">*</span></Label>
          <Input
            id="postcode"
            value={formData.postcode}
            onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
            placeholder="e.g., SW1A 1AA"
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="is_default"
            checked={formData.is_default}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: !!checked }))}
          />
          <Label htmlFor="is_default" className="cursor-pointer">Set as default address</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderAddressCard = (address: ClientAddress) => (
    <div 
      key={address.id} 
      className={cn(
        "p-4 border rounded-lg transition-all",
        address.is_default 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-muted-foreground/30"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 text-muted-foreground">
            {getLabelIcon(address.address_label)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{address.address_label || 'Address'}</span>
              {address.is_default && (
                <Badge variant="default" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              {formatAddress(address)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!address.is_default && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSetDefault(address.id)}
              disabled={setDefaultMutation.isPending}
              title="Set as default"
            >
              <Star className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(address)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteConfirmId(address.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className="p-4 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Address Information</h3>
          {!isAddingNew && !editingId && (
            <Button size="sm" variant="outline" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-1" />
              Add Address
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Add New Form */}
          {isAddingNew && renderAddressForm()}

          {/* Address List */}
          {addresses.length === 0 && !isAddingNew ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No addresses added yet</p>
              <p className="text-sm">Click "Add Address" to add the client's address</p>
            </div>
          ) : (
            addresses.map((address) => (
              editingId === address.id ? (
                <div key={address.id}>{renderAddressForm()}</div>
              ) : (
                renderAddressCard(address)
              )
            ))
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
