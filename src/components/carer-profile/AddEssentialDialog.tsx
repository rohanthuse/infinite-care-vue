import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AddEssentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  onAdd: (data: any) => void;
}

const categories = [
  { value: 'Background', label: 'Background' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Training', label: 'Training' },
  { value: 'Health', label: 'Health' },
  { value: 'Insurance', label: 'Insurance' },
];

const essentialTypes = {
  Background: ['dbs_check', 'references', 'employment_verification'],
  Legal: ['right_to_work', 'proof_of_identity', 'professional_registration'],
  Training: ['safeguarding', 'manual_handling', 'first_aid', 'fire_safety', 'infection_control', 'health_safety', 'medication_awareness'],
  Health: ['health_declaration', 'immunizations', 'occupational_health'],
  Insurance: ['professional_indemnity', 'public_liability'],
};

export const AddEssentialDialog: React.FC<AddEssentialDialogProps> = ({
  open,
  onOpenChange,
  staffId,
  onAdd,
}) => {
  const [category, setCategory] = useState<string>('');
  const [essentialType, setEssentialType] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [required, setRequired] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAdd({
      staff_id: staffId,
      category,
      essential_type: essentialType,
      display_name: displayName,
      required,
      expiry_date: expiryDate || null,
      notes: notes || null,
    });

    // Reset form
    setCategory('');
    setEssentialType('');
    setDisplayName('');
    setExpiryDate('');
    setRequired(true);
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Essential Requirement</DialogTitle>
          <DialogDescription>
            Add a new essential requirement for this staff member
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category && (
            <div className="space-y-2">
              <Label htmlFor="essentialType">Essential Type *</Label>
              <Select value={essentialType} onValueChange={setEssentialType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {essentialTypes[category as keyof typeof essentialTypes]?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., DBS Check, First Aid Certificate"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={required}
              onCheckedChange={(checked) => setRequired(checked as boolean)}
            />
            <Label htmlFor="required" className="cursor-pointer">
              This is a mandatory requirement
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or instructions"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Essential
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};