
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, FileText, Upload } from "lucide-react";
import { format } from "date-fns";

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
import { toast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(3, "Document name must be at least 3 characters"),
  date: z.date({
    required_error: "Date is required",
  }),
  type: z.string().min(1, "Document type is required"),
  author: z.string().min(1, "Author is required"),
  file: z.any().refine((file) => file?.length > 0, "File is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (document: { name: string; date: Date; type: string; author: string; file: File }) => void;
}

export function UploadDocumentDialog({ 
  open, 
  onOpenChange, 
  onSave 
}: UploadDocumentDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: new Date(),
      type: "",
      author: "",
    },
  });

  function onSubmit(data: FormValues) {
    // Extract the file from the FileList
    const file = data.file[0];
    
    onSave({
      name: data.name,
      date: data.date,
      type: data.type,
      author: data.author,
      file: file
    });
    
    form.reset();
    onOpenChange(false);
    toast({
      title: "Document uploaded",
      description: "The document has been uploaded successfully",
    });
  }

  // Mocked document types
  const documentTypes = [
    "PDF",
    "DOCX",
    "Image",
    "Report",
    "Assessment",
    "Care Plan"
  ];

  // Mocked staff list for demo
  const staffList = [
    { id: "1", name: "Dr. Sarah Johnson" },
    { id: "2", name: "Dr. James Wilson" },
    { id: "3", name: "Nurse Emily Chen" },
    { id: "4", name: "Therapist Michael Brown" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <FileText className="h-5 w-5" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload a new document to the patient's record
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
                    <Input placeholder="Medical Report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select author" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.name}>
                          {staff.name}
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
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => onChange(e.target.files)}
                        {...rest}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-700">Click to select a file</p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDFs, DOCx, and images accepted
                        </p>
                      </label>
                      {value && value[0] && (
                        <div className="mt-2 text-sm text-blue-600 font-medium">
                          Selected: {value[0].name}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Upload Document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
