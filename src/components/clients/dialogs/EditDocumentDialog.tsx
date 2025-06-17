
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientDocument } from "@/hooks/useClientDocuments";

const formSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  type: z.string().min(1, "Document type is required"),
  uploaded_by: z.string().min(1, "Uploader name is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (document: { id: string; name: string; type: string; uploaded_by: string }) => void;
  document: ClientDocument | null;
}

export function EditDocumentDialog({ open, onOpenChange, onSave, document }: EditDocumentDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      uploaded_by: "",
    },
  });

  useEffect(() => {
    if (document && open) {
      form.setValue("name", document.name);
      form.setValue("type", document.type);
      form.setValue("uploaded_by", document.uploaded_by);
    }
  }, [document, open, form]);

  function onSubmit(data: FormValues) {
    if (!document) return;
    
    onSave({
      id: document.id,
      name: data.name,
      type: data.type,
      uploaded_by: data.uploaded_by
    });
    onOpenChange(false);
  }

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Edit className="h-5 w-5" />
            Edit Document
          </DialogTitle>
          <DialogDescription>
            Modify the document details below
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Document name" {...field} />
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
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Medical Report">Medical Report</SelectItem>
                      <SelectItem value="Care Plan">Care Plan</SelectItem>
                      <SelectItem value="Legal Document">Legal Document</SelectItem>
                      <SelectItem value="Insurance">Insurance</SelectItem>
                      <SelectItem value="Assessment">Assessment</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Input placeholder="Uploader name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
