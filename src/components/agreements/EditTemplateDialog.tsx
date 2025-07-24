
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AgreementTemplate } from '@/types/agreements';
import { useUpdateTemplate, useAgreementTypes } from '@/data/hooks/agreements';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  type_id: z.string({ required_error: "Please select a type." }).uuid('Please select a valid type.'),
  content: z.string().optional(),
});

interface EditTemplateDialogProps {
  template: AgreementTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTemplateDialog: React.FC<EditTemplateDialogProps> = ({
  template,
  open,
  onOpenChange,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      type_id: undefined,
      content: '',
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        title: template.title,
        type_id: template.type_id || undefined,
        content: template.content || '',
      });
    }
  }, [template, form]);

  const { data: agreementTypes, isLoading: isLoadingTypes } = useAgreementTypes();
  const updateTemplateMutation = useUpdateTemplate();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!template) return;
    updateTemplateMutation.mutate(
      {
        id: template.id,
        title: values.title,
        type_id: values.type_id,
        content: values.content || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      }
    );
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Update the details of your agreement template.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pb-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Standard Employment Contract" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoadingTypes}>
                        <SelectValue placeholder="Select an agreement type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {agreementTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the template content here. You can use HTML."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTemplateMutation.isPending}>
                {updateTemplateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
