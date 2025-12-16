import React from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/currencyFormatter';

export interface EditableLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  visit_date?: string;
  isNew?: boolean;
}

interface EditableLineItemsSectionProps {
  lineItems: EditableLineItem[];
  onUpdate: (items: EditableLineItem[]) => void;
  isReadOnly?: boolean;
}

export function EditableLineItemsSection({
  lineItems,
  onUpdate,
  isReadOnly = false,
}: EditableLineItemsSectionProps) {
  const addLineItem = () => {
    const newItem: EditableLineItem = {
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      line_total: 0,
      isNew: true,
    };
    onUpdate([...lineItems, newItem]);
  };

  const removeLineItem = (index: number) => {
    onUpdate(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof EditableLineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate line total
    if (field === 'quantity' || field === 'unit_price' || field === 'discount_amount') {
      const item = updatedItems[index];
      item.line_total = Math.max(0, (item.quantity * item.unit_price) - item.discount_amount);
    }

    onUpdate(updatedItems);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Line Items
        </h3>
        {!isReadOnly && (
          <Button type="button" onClick={addLineItem} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      {lineItems.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead className="w-[10%]">Qty</TableHead>
                <TableHead className="w-[15%]">Unit Price (£)</TableHead>
                <TableHead className="w-[15%]">Discount (£)</TableHead>
                <TableHead className="w-[15%]">Total</TableHead>
                {!isReadOnly && <TableHead className="w-[5%]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item, index) => (
                <TableRow key={item.id || `new-${index}`}>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      disabled={isReadOnly}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-16 h-8"
                      min={0}
                      step={0.5}
                      disabled={isReadOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-24 h-8"
                      min={0}
                      disabled={isReadOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.discount_amount}
                      onChange={(e) => updateLineItem(index, 'discount_amount', parseFloat(e.target.value) || 0)}
                      className="w-24 h-8"
                      min={0}
                      disabled={isReadOnly}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(item.line_total)}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">No line items</p>
          {!isReadOnly && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={addLineItem}
              className="mt-2"
            >
              Add your first line item
            </Button>
          )}
        </div>
      )}

      {lineItems.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm bg-muted/50 px-4 py-2 rounded-md">
            <span className="text-muted-foreground">Line Items Subtotal:</span>
            <span className="ml-2 font-semibold">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
