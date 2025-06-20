
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import { useFileCategoryOptions } from '@/hooks/useParameterOptions';

interface UploadDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (document: any) => void;
}

export const UploadDocumentDialog: React.FC<UploadDocumentDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const { options: fileCategoryOptions, isLoading: categoriesLoading } = useFileCategoryOptions();
  
  const form = useForm({
    defaultValues: {
      name: '',
      type: '',
      uploaded_by: 'Current User',
      file: null,
    },
  });

  const handleSubmit = (data: any) => {
    const documentData = {
      ...data,
      upload_date: new Date().toISOString().split('T')[0],
      file_size: data.file ? `${(data.file.size / 1024).toFixed(2)} KB` : '0 KB',
    };
    
    onUpload(documentData);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document for this client's care record.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter document name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={categoriesLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select document category"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fileCategoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      />
                      <Upload className="h-4 w-4 text-gray-400" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uploaded_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uploaded By</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Upload Document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
