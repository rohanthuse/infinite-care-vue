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
import { Calendar as CalendarIcon, Loader2, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAgreementTypes, useAgreementTemplates, useClients, useStaff, useCreateAgreement } from "@/data/hooks/agreements";
import { FileUploadDropzone } from "./FileUploadDropzone";
import { EnhancedSignatureCanvas } from "./EnhancedSignatureCanvas";
import { useAgreementWorkflow } from "@/hooks/useAgreementWorkflow";
import { useBranchNavigation } from "@/hooks/useBranchNavigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [createdAgreementId, setCreatedAgreementId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState(branchId === "global" ? "" : branchId);
  
  // Check if we need branch selection (when opened from global page)
  const isGlobalContext = branchId === "global";
  const effectiveBranchId = isGlobalContext ? selectedBranchId : branchId;
  
  // Fetch data
  const { data: branches, isLoading: branchesLoading } = useBranchNavigation();
  const { data: agreementTypes, isLoading: typesLoading } = useAgreementTypes();
  const { data: templates, isLoading: templatesLoading } = useAgreementTemplates({
    searchQuery: "",
    typeFilter: selectedType || "all",
    branchId: effectiveBranchId
  });
  const { data: clients, isLoading: clientsLoading } = useClients(effectiveBranchId);
  const { data: staff, isLoading: staffLoading } = useStaff(effectiveBranchId);
  
  const createAgreementMutation = useCreateAgreement();
  const { workflowState, handleFileUpload, setSignature, resetWorkflow } = useAgreementWorkflow();
  
  const handleCreateAgreement = async () => {
    if (!title || !selectedType || !signerName || !signedDate) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (isGlobalContext && !selectedBranchId) {
      toast.error("Please select a branch");
      return false;
    }
    
    try {
      // Create the agreement with Pending status initially
      const agreementData = {
        title,
        content: content || null,
        template_id: selectedTemplate || null,
        type_id: selectedType,
        status: "Pending" as const,
        signed_by_name: signerName,
        signed_by_client_id: signingParty === "client" ? selectedClient || null : null,
        signed_by_staff_id: signingParty === "staff" ? selectedStaff || null : null,
        signing_party: signingParty,
        signed_at: signedDate.toISOString(),
        digital_signature: null, // Will be updated in final step
        primary_document_id: null,
        signature_file_id: null,
        branch_id: effectiveBranchId,
      };

      console.log('[SignAgreementDialog] Creating agreement with data:', agreementData);

      // Create agreement and get the response
      const newAgreement = await createAgreementMutation.mutateAsync(agreementData);
      
      if (newAgreement?.id) {
        setCreatedAgreementId(newAgreement.id);
        toast.success("Agreement created! You can now upload documents.");
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error creating agreement:', error);
      const errorMessage = error?.message || 'Failed to create agreement';
      toast.error(`Failed to create agreement: ${errorMessage}`);
      return false;
    }
  };

  const handleSignAgreement = async () => {
    if (!createdAgreementId) {
      toast.error("Agreement not found");
      return;
    }
    
    try {
      // Update the existing agreement with signature and Active status
      const { error } = await supabase
        .from('agreements')
        .update({
          status: "Active",
          digital_signature: digitalSignature || null
        })
        .eq('id', createdAgreementId);

      if (error) {
        throw new Error(error.message);
      }
      
      toast.success("Agreement signed successfully!");
      
      // Close dialog after successful signing
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 1000);
    } catch (error: any) {
      console.error('Error signing agreement:', error);
      const errorMessage = error?.message || 'Failed to sign agreement';
      toast.error(`Failed to sign agreement: ${errorMessage}`);
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
    setCreatedAgreementId(null);
    setSelectedBranchId(branchId === "global" ? "" : branchId);
    resetWorkflow();
  };

  // Auto-populate signer name when client or staff is selected
  React.useEffect(() => {
    if (signingParty === "client" && selectedClient && clients) {
      const client = clients.find(c => c.id === selectedClient);
      if (client) {
        setSignerName(`${client.first_name} ${client.last_name}`);
      }
    } else if (signingParty === "staff" && selectedStaff && staff) {
      const staffMember = staff.find(s => s.id === selectedStaff);
      if (staffMember) {
        setSignerName(`${staffMember.first_name} ${staffMember.last_name}`);
      }
    } else if (signingParty === "other") {
      setSignerName("");
    }
  }, [signingParty, selectedClient, selectedStaff, clients, staff]);

  const isLoading = typesLoading || templatesLoading || clientsLoading || staffLoading || branchesLoading;

  const canProceedToStep2 = title && selectedType && signerName && signedDate && 
    (isGlobalContext ? selectedBranchId : true);
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
              {isGlobalContext && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select a branch to create this agreement for.
                  </AlertDescription>
                </Alert>
              )}

              {isGlobalContext && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                    agreementId={createdAgreementId || undefined}
                    category="document"
                    maxFiles={5}
                    disabled={!createdAgreementId}
                  />
                  {!createdAgreementId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Complete Step 1 to enable file uploads
                    </p>
                  )}
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
                    agreementId={createdAgreementId || undefined}
                    initialSignature={digitalSignature}
                    disabled={false}
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
              onClick={async () => {
                if (currentStep === 1) {
                  // Create agreement when moving from step 1 to step 2
                  const success = await handleCreateAgreement();
                  if (success) {
                    setCurrentStep(currentStep + 1);
                  }
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={currentStep === 1 ? !canProceedToStep2 : false}
            >
              {createAgreementMutation.isPending && currentStep === 1 ? "Creating..." : "Next"}
            </Button>
          ) : (
            <Button 
              onClick={handleSignAgreement} 
              disabled={createAgreementMutation.isPending || !canComplete}
            >
              {createAgreementMutation.isPending ? "Signing..." : "Sign Agreement"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
