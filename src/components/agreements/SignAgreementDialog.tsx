
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Upload, Users, Tag, UserCheck, FileCheck, Signature } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock clients list
const mockClients = [
  { id: "CL001", name: "Aderinsola Thomas" },
  { id: "CL002", name: "James Wilson" },
  { id: "CL003", name: "Sophia Martinez" },
  { id: "CL004", name: "Michael Johnson" },
  { id: "CL005", name: "Emma Williams" },
  { id: "CL006", name: "Daniel Smith" },
  { id: "CL007", name: "Olivia Brown" },
  { id: "CL008", name: "Noah Davis" }
];

// Mock staff list
const mockStaff = [
  { id: "ST001", name: "Alex Chen" },
  { id: "ST002", name: "Maria Rodriguez" },
  { id: "ST003", name: "John Williams" },
  { id: "ST004", name: "Sarah Johnson" },
  { id: "ST005", name: "David Brown" },
  { id: "ST006", name: "Lisa Thompson" },
  { id: "ST007", name: "Robert Wilson" },
  { id: "ST008", name: "Jennifer Lewis" }
];

// Mock templates list
const mockTemplates = [
  { id: 1, title: "Standard Employment Contract", type: "Employment Agreement" },
  { id: 2, title: "Non-Disclosure Agreement", type: "NDA" },
  { id: 3, title: "Service Level Agreement", type: "Service Agreement" },
  { id: 4, title: "Data Processing Agreement", type: "Data Agreement" },
  { id: 5, title: "Caretaker Contract", type: "Employment Agreement" }
];

interface SignAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
}

export function SignAgreementDialog({
  open,
  onOpenChange,
  branchId
}: SignAgreementDialogProps) {
  const [title, setTitle] = useState("");
  const [signingParty, setSigningParty] = useState("client");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [signedDate, setSignedDate] = useState<Date | undefined>(new Date());
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [agreementStatus, setAgreementStatus] = useState("Active");
  const [digitalSignature, setDigitalSignature] = useState("");
  const [agreementType, setAgreementType] = useState("Employment Agreement");
  const [confirmSign, setConfirmSign] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSignAgreement = async () => {
    if (!title || (!selectedClient && !selectedStaff) || !signedDate || !digitalSignature || !confirmSign) {
      toast.error("Please fill in all required fields and confirm signature");
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, we would make an API call here with all the data
      const signeeId = signingParty === "client" ? selectedClient : selectedStaff;
      const signeeName = signingParty === "client" 
        ? mockClients.find(c => c.id === selectedClient)?.name 
        : mockStaff.find(s => s.id === selectedStaff)?.name;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Agreement signed successfully");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to sign agreement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setTitle("");
    setSigningParty("client");
    setSelectedClient("");
    setSelectedStaff("");
    setSignedDate(new Date());
    setSelectedTemplate("");
    setDocumentUploaded(false);
    setAgreementStatus("Active");
    setDigitalSignature("");
    setAgreementType("Employment Agreement");
    setConfirmSign(false);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white px-6 pt-6 pb-2 border-b">
          <DialogTitle>Sign New Agreement</DialogTitle>
          <DialogDescription>
            Complete the form to record a new signed agreement
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Agreement Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="Enter agreement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Signing Party <span className="text-red-500">*</span>
              </label>
              <RadioGroup 
                defaultValue="client" 
                className="flex space-x-4"
                value={signingParty}
                onValueChange={setSigningParty}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="client" id="client" />
                  <Label htmlFor="client">Client</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="staff" id="staff" />
                  <Label htmlFor="staff">Staff</Label>
                </div>
              </RadioGroup>
            </div>

            {signingParty === "client" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Client <span className="text-red-500">*</span>
                </label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Staff Member <span className="text-red-500">*</span>
                </label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Agreement Template
              </label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {mockTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <span className="text-red-500">*</span>
              </label>
              <Select value={agreementType} onValueChange={setAgreementType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select agreement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employment Agreement">Employment Agreement</SelectItem>
                  <SelectItem value="Service Agreement">Service Agreement</SelectItem>
                  <SelectItem value="NDA">Non-Disclosure Agreement</SelectItem>
                  <SelectItem value="Data Agreement">Data Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Status <span className="text-red-500">*</span>
              </label>
              <Select value={agreementStatus} onValueChange={setAgreementStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Date Signed <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !signedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {signedDate ? format(signedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={signedDate}
                    onSelect={setSignedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Agreement Document</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDocumentUploaded(true)}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {documentUploaded ? "Document Uploaded" : "Upload Document"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Digital Signature <span className="text-red-500">*</span></label>
              <div className="flex flex-col space-y-4">
                <Input
                  placeholder="Type your full name to sign"
                  value={digitalSignature}
                  onChange={(e) => setDigitalSignature(e.target.value)}
                  className="border-dashed border-2 font-handwriting text-center text-lg"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Signature className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500">
                    This digital signature is legally binding
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="confirm" 
                checked={confirmSign}
                onCheckedChange={(checked) => setConfirmSign(checked as boolean)} 
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="confirm"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I confirm that I have read and agree to the terms of this agreement <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-muted-foreground">
                  By checking this box, you confirm that you are authorized to sign this agreement.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex flex-row justify-end space-x-2 px-6 py-4 border-t bg-white">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSignAgreement}
            disabled={loading || !title || (!selectedClient && !selectedStaff) || !signedDate || !digitalSignature || !confirmSign}
          >
            {loading ? "Processing..." : "Sign Agreement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
