import { useState } from 'react';
import { useFluidIntakeRecords, useAddFluidIntakeRecord, useDeleteFluidIntakeRecord } from '@/hooks/useFluidIntakeRecords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface FluidIntakeSectionProps {
  clientId: string;
  date: string;
}

const FLUID_TYPES = ['Water', 'Tea', 'Coffee', 'Juice', 'Soup', 'Milk', 'Smoothie', 'Other'];
const METHODS = ['Oral', 'PEG', 'NG Tube', 'IV', 'Other'];

export function FluidIntakeSection({ clientId, date }: FluidIntakeSectionProps) {
  const { data: records = [], isLoading } = useFluidIntakeRecords(clientId, date);
  const addRecord = useAddFluidIntakeRecord();
  const deleteRecord = useDeleteFluidIntakeRecord();

  const [newRecord, setNewRecord] = useState({
    time: format(new Date(), 'HH:mm'),
    fluid_type: 'Water',
    amount_ml: '',
    method: 'Oral',
    comments: '',
  });

  const handleAdd = () => {
    if (!newRecord.amount_ml || parseInt(newRecord.amount_ml) <= 0) return;

    const timeDate = new Date(`${date}T${newRecord.time}:00`);

    addRecord.mutate({
      client_id: clientId,
      record_date: date,
      time: timeDate.toISOString(),
      fluid_type: newRecord.fluid_type,
      amount_ml: parseInt(newRecord.amount_ml),
      method: newRecord.method,
      comments: newRecord.comments || undefined,
    }, {
      onSuccess: () => {
        setNewRecord({
          time: format(new Date(), 'HH:mm'),
          fluid_type: 'Water',
          amount_ml: '',
          method: 'Oral',
          comments: '',
        });
      },
    });
  };

  const totalIntake = records.reduce((sum, r) => sum + r.amount_ml, 0);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Intake Entry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-sm text-muted-foreground">Time</label>
            <Input
              type="time"
              value={newRecord.time}
              onChange={(e) => setNewRecord({ ...newRecord, time: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Fluid Type</label>
            <Select value={newRecord.fluid_type} onValueChange={(v) => setNewRecord({ ...newRecord, fluid_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLUID_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Amount (ml)</label>
            <Input
              type="number"
              min="1"
              max="5000"
              value={newRecord.amount_ml}
              onChange={(e) => setNewRecord({ ...newRecord, amount_ml: e.target.value })}
              placeholder="250"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Method</label>
            <Select value={newRecord.method} onValueChange={(v) => setNewRecord({ ...newRecord, method: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={addRecord.isPending} className="w-full">
              Add Entry
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-sm text-muted-foreground">Comments (optional)</label>
          <Textarea
            value={newRecord.comments}
            onChange={(e) => setNewRecord({ ...newRecord, comments: e.target.value })}
            placeholder="Any additional notes..."
            rows={2}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type of Fluid</TableHead>
              <TableHead>Amount (ml)</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No intake records for this date
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.time), 'HH:mm')}</TableCell>
                  <TableCell>{record.fluid_type}</TableCell>
                  <TableCell className="font-medium">{record.amount_ml} ml</TableCell>
                  <TableCell>{record.method}</TableCell>
                  <TableCell className="max-w-xs truncate">{record.comments || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecord.mutate({ id: record.id, clientId, date })}
                      disabled={deleteRecord.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
        <span className="font-medium">Total Intake (ml):</span>
        <span className="text-2xl font-bold text-primary">{totalIntake} ml</span>
      </div>
    </div>
  );
}
