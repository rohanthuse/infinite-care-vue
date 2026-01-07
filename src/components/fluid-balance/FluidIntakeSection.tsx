import { useState } from 'react';
import { useFluidIntakeRecords, useAddFluidIntakeRecord, useDeleteFluidIntakeRecord } from '@/hooks/useFluidIntakeRecords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface FluidIntakeSectionProps {
  clientId: string;
  date: string;
  visitRecordId?: string;
}

const FLUID_TYPES = ['Water', 'Tea', 'Coffee', 'Juice', 'Soup', 'Milk', 'Smoothie', 'Other'];
const METHODS = ['Oral', 'PEG', 'NG Tube', 'IV', 'Other'];

export function FluidIntakeSection({ clientId, date, visitRecordId }: FluidIntakeSectionProps) {
  const { toast } = useToast();
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
    if (!clientId) {
      console.error('[FluidIntake] Save failed: clientId is missing');
      toast({ 
        title: 'Error', 
        description: 'Client ID is missing. Please try again.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (!newRecord.amount_ml || parseInt(newRecord.amount_ml) <= 0) return;

    const timeDate = new Date(`${date}T${newRecord.time}:00`);

    console.log('[FluidIntake] Attempting to save:', {
      client_id: clientId,
      record_date: date,
      amount_ml: newRecord.amount_ml,
      fluid_type: newRecord.fluid_type
    });

    addRecord.mutate({
      client_id: clientId,
      record_date: date,
      visit_record_id: visitRecordId,
      time: timeDate.toISOString(),
      fluid_type: newRecord.fluid_type,
      amount_ml: parseInt(newRecord.amount_ml),
      method: newRecord.method,
      comments: newRecord.comments || undefined,
    }, {
      onSuccess: () => {
        console.log('[FluidIntake] Save successful');
        setNewRecord({
          time: format(new Date(), 'HH:mm'),
          fluid_type: 'Water',
          amount_ml: '',
          method: 'Oral',
          comments: '',
        });
      },
      onError: (error) => {
        console.error('[FluidIntake] Save failed:', error);
      }
    });
  };

  const totalIntake = records.reduce((sum, r) => sum + r.amount_ml, 0);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-3 sm:p-4 bg-muted/30">
        <h3 className="font-medium mb-3 flex items-center gap-2 text-sm sm:text-base">
          <Plus className="h-4 w-4" />
          Add Intake Entry
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <div>
            <label className="text-xs sm:text-sm text-muted-foreground">Time</label>
            <Input
              type="time"
              value={newRecord.time}
              onChange={(e) => setNewRecord({ ...newRecord, time: e.target.value })}
              className="h-9 sm:h-10"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm text-muted-foreground">Fluid Type</label>
            <Select value={newRecord.fluid_type} onValueChange={(v) => setNewRecord({ ...newRecord, fluid_type: v })}>
              <SelectTrigger className="h-9 sm:h-10">
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
            <label className="text-xs sm:text-sm text-muted-foreground">Amount (ml)</label>
            <Input
              type="number"
              min="1"
              max="5000"
              value={newRecord.amount_ml}
              onChange={(e) => setNewRecord({ ...newRecord, amount_ml: e.target.value })}
              placeholder="250"
              className="h-9 sm:h-10"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm text-muted-foreground">Method</label>
            <Select value={newRecord.method} onValueChange={(v) => setNewRecord({ ...newRecord, method: v })}>
              <SelectTrigger className="h-9 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-end">
            <Button onClick={handleAdd} disabled={addRecord.isPending || !clientId} className="w-full h-9 sm:h-10 text-sm">
              {addRecord.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Entry'
              )}
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs sm:text-sm text-muted-foreground">Comments (optional)</label>
          <Textarea
            value={newRecord.comments}
            onChange={(e) => setNewRecord({ ...newRecord, comments: e.target.value })}
            placeholder="Any additional notes..."
            rows={2}
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Mobile card view */}
        <div className="sm:hidden divide-y">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : records.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No intake records for this date</div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="p-3 flex justify-between items-start gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="font-medium text-sm">{format(new Date(record.time), 'HH:mm')} - {record.fluid_type}</div>
                  <div className="text-sm text-muted-foreground">{record.amount_ml} ml via {record.method}</div>
                  {record.comments && <div className="text-xs text-muted-foreground truncate">{record.comments}</div>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRecord.mutate({ id: record.id, clientId, date })}
                  disabled={deleteRecord.isPending}
                  className="flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
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
      </div>

      <div className="flex justify-between items-center p-3 sm:p-4 bg-primary/10 rounded-lg">
        <span className="font-medium text-sm sm:text-base">Total Intake (ml):</span>
        <span className="text-xl sm:text-2xl font-bold text-primary">{totalIntake} ml</span>
      </div>
    </div>
  );
}
