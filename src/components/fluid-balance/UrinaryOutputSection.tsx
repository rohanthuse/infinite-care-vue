import { useState } from 'react';
import { useUrinaryOutputRecords, useAddUrinaryOutputRecord, useDeleteUrinaryOutputRecord } from '@/hooks/useUrinaryOutputRecords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface UrinaryOutputSectionProps {
  clientId: string;
  date: string;
}

const COLLECTION_METHODS = ['Toilet', 'Pad', 'Catheter', 'Bedpan', 'Urinal', 'Other'];
const COLOURS = ['Pale yellow', 'Yellow', 'Dark amber', 'Brown', 'Red-tinged', 'Clear', 'Other'];
const ODOURS = ['Normal', 'Strong', 'Offensive', 'Sweet', 'Unusual'];
const ESTIMATES = ['Small', 'Moderate', 'Large'];

export function UrinaryOutputSection({ clientId, date }: UrinaryOutputSectionProps) {
  const { toast } = useToast();
  const { data: records = [], isLoading } = useUrinaryOutputRecords(clientId, date);
  const addRecord = useAddUrinaryOutputRecord();
  const deleteRecord = useDeleteUrinaryOutputRecord();

  const [newRecord, setNewRecord] = useState({
    time: format(new Date(), 'HH:mm'),
    collection_method: 'Toilet',
    amount_ml: '',
    amount_estimate: '',
    colour: 'Pale yellow',
    odour: 'Normal',
    discomfort_observations: '',
  });

  const [useEstimate, setUseEstimate] = useState(false);

  const handleAdd = () => {
    if (!clientId) {
      console.error('[UrinaryOutput] Save failed: clientId is missing');
      toast({ 
        title: 'Error', 
        description: 'Client ID is missing. Please try again.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (!useEstimate && (!newRecord.amount_ml || parseInt(newRecord.amount_ml) <= 0)) return;
    if (useEstimate && !newRecord.amount_estimate) return;

    const timeDate = new Date(`${date}T${newRecord.time}:00`);

    console.log('[UrinaryOutput] Attempting to save:', {
      client_id: clientId,
      record_date: date,
      collection_method: newRecord.collection_method
    });

    addRecord.mutate({
      client_id: clientId,
      record_date: date,
      time: timeDate.toISOString(),
      collection_method: newRecord.collection_method,
      amount_ml: useEstimate ? undefined : parseInt(newRecord.amount_ml),
      amount_estimate: useEstimate ? newRecord.amount_estimate : undefined,
      colour: newRecord.colour || undefined,
      odour: newRecord.odour || undefined,
      discomfort_observations: newRecord.discomfort_observations || undefined,
    }, {
      onSuccess: () => {
        console.log('[UrinaryOutput] Save successful');
        setNewRecord({
          time: format(new Date(), 'HH:mm'),
          collection_method: 'Toilet',
          amount_ml: '',
          amount_estimate: '',
          colour: 'Pale yellow',
          odour: 'Normal',
          discomfort_observations: '',
        });
      },
      onError: (error) => {
        console.error('[UrinaryOutput] Save failed:', error);
      }
    });
  };

  const totalUrinaryOutput = records.reduce((sum, r) => sum + (r.amount_ml || 0), 0);

  const hasAbnormalRecords = records.some(r => 
    r.colour && ['Dark amber', 'Brown', 'Red-tinged'].includes(r.colour) ||
    r.odour && ['Strong', 'Offensive', 'Unusual'].includes(r.odour) ||
    r.discomfort_observations
  );

  return (
    <div className="space-y-4">
      {hasAbnormalRecords && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Attention Required</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Some urinary observations require review. Check for abnormal color, odor, or reported discomfort.
            </p>
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Urinary Entry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-sm text-muted-foreground">Time</label>
            <Input
              type="time"
              value={newRecord.time}
              onChange={(e) => setNewRecord({ ...newRecord, time: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Method</label>
            <Select value={newRecord.collection_method} onValueChange={(v) => setNewRecord({ ...newRecord, collection_method: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLLECTION_METHODS.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
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
            <label className="text-sm text-muted-foreground">Colour</label>
            <Select value={newRecord.colour} onValueChange={(v) => setNewRecord({ ...newRecord, colour: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOURS.map(colour => (
                  <SelectItem key={colour} value={colour}>{colour}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Odour</label>
            <Select value={newRecord.odour} onValueChange={(v) => setNewRecord({ ...newRecord, odour: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ODOURS.map(odour => (
                  <SelectItem key={odour} value={odour}>{odour}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={addRecord.isPending || !clientId} className="w-full">
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
          <label className="text-sm text-muted-foreground">Discomfort / Observations</label>
          <Textarea
            value={newRecord.discomfort_observations}
            onChange={(e) => setNewRecord({ ...newRecord, discomfort_observations: e.target.value })}
            placeholder="Note any pain, urgency, difficulty passing urine, or other observations..."
            rows={2}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Colour</TableHead>
              <TableHead>Odour</TableHead>
              <TableHead>Discomfort/Observations</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No urinary output records for this date
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.time), 'HH:mm')}</TableCell>
                  <TableCell>{record.collection_method}</TableCell>
                  <TableCell className="font-medium">
                    {record.amount_ml ? `${record.amount_ml} ml` : record.amount_estimate || '-'}
                  </TableCell>
                  <TableCell>
                    {record.colour && ['Dark amber', 'Brown', 'Red-tinged'].includes(record.colour) ? (
                      <Badge variant="destructive">{record.colour}</Badge>
                    ) : (
                      <span>{record.colour || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.odour && ['Strong', 'Offensive', 'Unusual'].includes(record.odour) ? (
                      <Badge variant="destructive">{record.odour}</Badge>
                    ) : (
                      <span>{record.odour || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {record.discomfort_observations ? (
                      <span className="text-destructive font-medium">{record.discomfort_observations}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
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

      <div className="flex justify-between items-center p-4 bg-accent/10 rounded-lg">
        <span className="font-medium">Total Urinary Output (ml):</span>
        <span className="text-2xl font-bold text-accent">{totalUrinaryOutput} ml</span>
      </div>
    </div>
  );
}
