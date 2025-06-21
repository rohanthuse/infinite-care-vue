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
import { Calendar as CalendarIcon, Users, Tag, FileText, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgreementTypes, useAgreementTemplates, useClients, useStaff, useCreateAgreement } from "@/data/hooks/agreements";
import { FileUploadDropzone } from "./FileUploadDropzone";
import { EnhancedSignatureCanvas } from "./EnhancedSignatureCanvas";

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
  const [selectedType, setSelectedType] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [signingParty, setSigningParty] = useState<"client" | "staff" | "other">("client");
  const [signerName, setSignerName] = useState("");
  const [signedDate, setSignedDate] = useState<Date | undefined>(new Date());
  const [digitalSignature, setDigitalSignature] = useState("");
  const [content, setContent] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  
  // Fetch data
  const { data: agreementTypes, isLoading: typesLoading } = useAgreementTypes();
  const { data: templates, isLoading: templatesLoading } = useAgreementTemplates({
    searchQuery: "",
    typeFilter: selectedType || "all",
    branchId
  });
  const { data: clients, isLoading: clientsLoading } = useClients(branchId);
  const { data: staff, isLoading: staffLoading } = useStaff(branchId);
  
  const createAgreementMutation = useCreateAgreement();
  
  const handleSignAgreement = async () => {
    if (!title || !selectedType || !signerName || !signedDate) {
      return;
    }
    
    try {
      await createAgreementMutation.mutateAsync({
        title,
        content: content || null,
        template_id: selectedTemplate || null,
        type_id: selectedType,
        status: "Active" as const,
        signed_by_name: signerName,
        signed_by_client_id: signingParty === "client" ? selectedClient || null : null,
        signed_by_staff_id: signingParty === "staff" ? selectedStaff || null : null,
        signing_party: signingParty,
        signed_at: signedDate.toISOString(),
        digital_signature: digitalSignature || null,
        branch_id: branchId !== "global" ? branchId : null,
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating agreement:', error);
    }
  };
  
  const resetForm = () => {
    setTitle("");
    setSelectedType("");
    setSelectedTemplate("");
    setSelectedClient("");
    setSelectedStaff("");
    setSigningParty("client");
    setSignerName("");
    setSignedDate(new Date());
    setDigitalSignature("");
    setContent("");
    setCurrentStep(1);
  };

  const isLoading = typesLoading || templatesLoading || clientsLoading || staffLoading;

  const canProceedToStep2 = title && selectedType && signerName && signedDate;
  const canComplete = canProceedToStep2;

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sign New Agreement</DialogTitle>
          <DialogDescription>
            Record a new signed agreement with documents and signatures
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs value={`step${currentStep}`} onValueChange={(value) => setCurrentStep(parseInt(value.replace('step', '')))}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="step1">Agreement Details</TabsTrigger>
              <TabsTrigger value="step2" disabled={!canProceedToStep2}>Documents & Files</TabsTrigger>
              <TabsTrigger value="step3" disabled={!canProceedToStep2}>Digital Signature</TabsTrigger>
            </TabsList>

            <TabsContent value="step1" className="space-y-4 py-4">
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
                  Agreement Type <span className="text-red-500">*</span>
                </label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select agreement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {agreementTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Template (Optional)
                </label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Signing Party <span className="text-red-500">*</span>
                </label>
                <Select value={signingParty} onValueChange={(value: "client" | "staff" | "other") => setSigningParty(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {signingParty === "client" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {signingParty === "staff" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Staff Member</label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Signer Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter full name of person who signed"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                />
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
                <label className="text-sm font-medium">Agreement Content</label>
                <Textarea
                  placeholder="Enter agreement content or notes"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="step2" className="space-y-4 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Agreement Documents</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload the main agreement document and any supporting files
                  </p>
                  <FileUploadDropzone
                    agreementId="temp" // Will be replaced after agreement creation
                    category="document"
                    maxFiles={5}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="step3" className="space-y-4 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Digital Signature</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Draw your signature or upload a signature image
                  </p>
                  <EnhancedSignatureCanvas
                    onSignatureSave={setDigitalSignature}
                    agreementId="temp" // Will be replaced after agreement creation
                    initialSignature={digitalSignature}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button 
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous
            </Button>
          )}
          {currentStep < 3 ? (
            <Button 
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToStep2}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSignAgreement} 
              disabled={createAgreementMutation.isPending || !canComplete}
            >
              {createAgreementMutation.isPending ? "Processing..." : "Sign Agreement"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
