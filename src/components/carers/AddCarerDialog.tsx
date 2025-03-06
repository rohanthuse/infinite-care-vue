import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  User, Phone, Mail, MapPin, Calendar, Globe, 
  Briefcase, UserCheck, BadgeCheck, UserPlus, Upload 
} from "lucide-react";

import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, FormControl, FormField, FormItem, 
  FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  title: z.string().min(1, "Title is required"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  knownAs: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  gender: z.string().optional(),
  pronouns: z.string().optional(),
  dateOfBirth: z.date().optional(),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  mobile: z.string().min(8, "Please enter a valid mobile number"),
  additionalInfo: z.string().optional(),
  introduction: z.string().optional(),
  location: z.string().min(3, "Please enter a valid location").optional(),
  specialization: z.string().min(1, "Please select a specialization"),
  experience: z.string().optional(),
  availability: z.string().min(1, "Please select availability"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddCarerDialogProps {
  onAddCarer: (data: FormValues) => void;
}

export const AddCarerDialog = ({ onAddCarer }: AddCarerDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobTitle: "",
      title: "",
      firstName: "",
      middleName: "",
      lastName: "",
      knownAs: "",
      email: "",
      gender: "",
      pronouns: "",
      country: "",
      phone: "",
      mobile: "",
      additionalInfo: "",
      introduction: "",
      location: "",
      specialization: "",
      experience: "",
      availability: "",
      notes: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    onAddCarer(data);
    form.reset();
    setSelectedFile(null);
    setOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 rounded-md">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Carer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-semibold">
            <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
            Add New Carer
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base after:content-['*'] after:text-red-500 after:ml-0.5">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                      Job Title
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-100">
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Administrator">Administrator</SelectItem>
                        <SelectItem value="Carer">Carer</SelectItem>
                        <SelectItem value="Home Manager">Home Manager</SelectItem>
                        <SelectItem value="Nurse">Nurse</SelectItem>
                        <SelectItem value="Support Worker">Support Worker</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base after:content-['*'] after:text-red-500 after:ml-0.5">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      Title
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-100">
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Miss">Miss</SelectItem>
                        <SelectItem value="Ms">Ms</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base after:content-['*'] after:text-red-500 after:ml-0.5">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      Middle Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter middle name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base after:content-['*'] after:text-red-500 after:ml-0.5">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      Surname
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter surname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="knownAs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      Known As
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter preferred name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base after:content-['*'] after:text-red-500 after:ml-0.5">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="flex items-center text-base">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      Gender
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row items-center gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Male" id="male" />
                          <Label htmlFor="male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Female" id="female" />
                          <Label htmlFor="female">Female</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pronouns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      Pronouns
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pronouns" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center text-base">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      Date of Birth
                    </FormLabel>
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
                              format(field.value, "dd-MM-yyyy")
                            ) : (
                              <span>day-month-year</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base after:content-['*'] after:text-red-500 after:ml-0.5">
                      <Globe className="h-4 w-4 mr-2 text-gray-500" />
                      Country
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-100">
                          <SelectValue placeholder="England" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="England">England</SelectItem>
                        <SelectItem value="Scotland">Scotland</SelectItem>
                        <SelectItem value="Wales">Wales</SelectItem>
                        <SelectItem value="Northern Ireland">Northern Ireland</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base after:content-['*'] after:text-red-500 after:ml-0.5">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      Mobile Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      Telephone Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter telephone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label className="flex items-center text-base">
                  <Upload className="h-4 w-4 mr-2 text-gray-500" />
                  Upload CV
                </Label>
                <div className="mt-1 border-2 border-dashed border-gray-300 rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                      onClick={() => document.getElementById('cvUpload')?.click()}
                    >
                      Select files...
                    </Button>
                    <input
                      id="cvUpload"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <span className="text-gray-500">
                      {selectedFile ? selectedFile.name : "Drop files here to upload"}
                    </span>
                  </div>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base">
                      <Globe className="h-4 w-4 mr-2 text-gray-500" />
                      Additional Information
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional information" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="introduction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base">
                      <Globe className="h-4 w-4 mr-2 text-gray-500" />
                      Introduction
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-100">
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Online Search">Online Search</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Job Board">Job Board</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                      Specialization
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Home Care">Home Care</SelectItem>
                        <SelectItem value="Elderly Care">Elderly Care</SelectItem>
                        <SelectItem value="Nurse">Nurse</SelectItem>
                        <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
                        <SelectItem value="Mental Health">Mental Health</SelectItem>
                        <SelectItem value="Disability Support">Disability Support</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <UserCheck className="h-4 w-4 mr-2 text-gray-500" />
                      Availability
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Weekends only">Weekends only</SelectItem>
                        <SelectItem value="Evenings only">Evenings only</SelectItem>
                        <SelectItem value="Flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <BadgeCheck className="h-4 w-4 mr-2" />
                Add Carer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
