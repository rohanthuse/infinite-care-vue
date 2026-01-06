import { useState } from 'react';
import { useFluidOutputRecords, useAddFluidOutputRecord, useDeleteFluidOutputRecord } from '@/hooks/useFluidOutputRecords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface FluidOutputSectionProps {
  clientId: string;
  date: string;
}

const OUTPUT_TYPES = ['Urine', 'Vomit', 'Drain', 'Stoma', 'Wound', 'Other'];
const ESTIMATES = ['Small', 'Moderate', 'Large'];
const APPEARANCES = ['Clear', 'Cloudy', 'Dark', 'Blood-stained', 'Yellow', 'Brown', 'Other'];

export function FluidOutputSection({ clientId, date }: FluidOutputSectionProps) {
  const { data: records = [], isLoading } = useFluidOutputRecords(clientId, date);
  const addRecord = useAddFluidOutputRecord();
  const deleteRecord = useDeleteFluidOutputRecord();

  const [newRecord, setNewRecord] = useState({
    time: format(new Date(), 'HH:mm'),
    output_type: 'Urine',
    amount_ml: '',
    amount_estimate: '',
    appearance: 'Clear',
    comments: '',
  });

  const [useEstimate, setUseEstimate] = useState(false);

  const handleAdd = () => {
    if (!useEstimate && (!newRecord.amount_ml || parseInt(newRecord.amount_ml) <= 0)) return;
    if (useEstimate && !newRecord.amount_estimate) return;

    const timeDate = new Date(`${date}T${newRecord.time}:00`);

    addRecord.mutate({
      client_id: clientId,
      record_date: date,
      time: timeDate.toISOString(),
      output_type: newRecord.output_type,
      amount_ml: useEstimate ? undefined : parseInt(newRecord.amount_ml),
      amount_estimate: useEstimate ? newRecord.amount_estimate : undefined,
      appearance: newRecord.appearance || undefined,
      comments: newRecord.comments || undefined,
    }, {
      onSuccess: () => {
        setNewRecord({
          time: format(new Date(), 'HH:mm'),
          output_type: 'Urine',
          amount_ml: '',
          amount_estimate: '',
          appearance: 'Clear',
          comments: '',
        });
      },
    });
  };

  const totalOutput = records.reduce((sum, r) => sum + (r.amount_ml || 0), 0);

  const getAppearanceBadge = (appearance?: string) => {
    if (!appearance) return null;
    const colors: Record<string, string> = {
      'Clear': 'bg-green-100 text-green-700',
      'Cloudy': 'bg-yellow-100 text-yellow-700',
      'Dark': 'bg-orange-100 text-orange-700',
      'Blood-stained': 'bg-red-100 text-red-700',
    };
    return <Badge className={colors[appearance] || 'bg-muted'}>{appearance}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Output Entry
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
            <label className="text-sm text-muted-foreground">Output Type</label>
            <Select value={newRecord.output_type} onValueChange={(v) => setNewRecord({ ...newRecord, output_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              Amount
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={useEstimate}
                  onChange={(e) => setUseEstimate(e.target.checked)}
                  className="rounded"
                />
                Estimate
              </label>
            </label>
            {useEstimate ? (
              <Select value={newRecord.amount_estimate} onValueChange={(v) => setNewRecord({ ...newRecord, amount_estimate: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {ESTIMATES.map(est => (
                    <SelectItem key={est} value={est}>{est}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="number"
                min="1"
                value={newRecord.amount_ml}
                onChange={(e) => setNewRecord({ ...newRecord, amount_ml: e.target.value })}
                placeholder="ml"
              />
            )}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Appearance</label>
            <Select value={newRecord.appearance} onValueChange={(v) => setNewRecord({ ...newRecord, appearance: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPEARANCES.map(app => (
                  <SelectItem key={app} value={app}>{app}</SelectItem>
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
              <TableHead>Type of Output</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Appearance</TableHead>
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
                  No output records for this date
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.time), 'HH:mm')}</TableCell>
                  <TableCell>{record.output_type}</TableCell>
                  <TableCell className="font-medium">
                    {record.amount_ml ? `${record.amount_ml} ml` : record.amount_estimate || '-'}
                  </TableCell>
                  <TableCell>{getAppearanceBadge(record.appearance)}</TableCell>
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

      <div className="flex justify-between items-center p-4 bg-secondary/10 rounded-lg">
        <span className="font-medium">Total Output (ml):</span>
        <span className="text-2xl font-bold text-secondary">{totalOutput} ml</span>
      </div>
    </div>
  );
}
