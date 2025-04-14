
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ExpenseCategory,
  ExpenseFilter,
  ExpenseStatus,
  expenseCategoryLabels,
  expenseStatusLabels,
} from "@/types/expense";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FilterExpensesDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ExpenseFilter) => void;
  currentFilters: ExpenseFilter;
}

const FilterExpensesDialog: React.FC<FilterExpensesDialogProps> = ({
  open,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  const form = useForm<ExpenseFilter>({
    defaultValues: currentFilters,
  });

  const handleSubmit = (data: ExpenseFilter) => {
    onApplyFilters(data);
    onClose();
  };

  const handleReset = () => {
    form.reset({
      categories: [],
      dateRange: { from: undefined, to: undefined },
      status: [],
      minAmount: undefined,
      maxAmount: undefined,
    });
    
    onApplyFilters({
      categories: [],
      dateRange: { from: undefined, to: undefined },
      status: [],
      minAmount: undefined,
      maxAmount: undefined,
    });
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Expenses</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormItem>
                <FormLabel className="text-base">Categories</FormLabel>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(Object.keys(expenseCategoryLabels) as ExpenseCategory[]).map(
                    (category) => (
                      <FormField
                        key={category}
                        control={form.control}
                        name="categories"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={category}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(category)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    return checked
                                      ? field.onChange([...currentValue, category])
                                      : field.onChange(
                                          currentValue.filter(
                                            (value) => value !== category
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {expenseCategoryLabels[category]}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    )
                  )}
                </div>
              </FormItem>

              <FormItem>
                <FormLabel className="text-base">Status</FormLabel>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(Object.keys(expenseStatusLabels) as ExpenseStatus[]).map(
                    (status) => (
                      <FormField
                        key={status}
                        control={form.control}
                        name="status"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={status}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(status)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    return checked
                                      ? field.onChange([...currentValue, status])
                                      : field.onChange(
                                          currentValue.filter(
                                            (value) => value !== status
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {expenseStatusLabels[status]}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    )
                  )}
                </div>
              </FormItem>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            );
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            );
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Range</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value?.from && "text-muted-foreground"
                              )}
                            >
                              {field.value?.from ? (
                                format(field.value.from, "PPP")
                              ) : (
                                <span>From date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value?.from}
                            onSelect={(date) =>
                              field.onChange({
                                ...field.value,
                                from: date,
                              })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value?.to && "text-muted-foreground"
                              )}
                            >
                              {field.value?.to ? (
                                format(field.value.to, "PPP")
                              ) : (
                                <span>To date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value?.to}
                            onSelect={(date) =>
                              field.onChange({
                                ...field.value,
                                to: date,
                              })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset All
              </Button>
              <Button type="submit">Apply Filters</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FilterExpensesDialog;
