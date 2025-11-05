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
import { MultiSelect } from "@/components/ui/multi-select";
import { useCreateSigners } from "@/hooks/useAgreementSigners";

interface SignAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  isOrganizationLevel?: boolean;
}

export function SignAgreementDialog({
  open,
  onOpenChange,
  branchId,
  isOrganizationLevel = false
}: SignAgreementDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [signingParty, setSigningParty] = useState<"client" | "staff" | "other">("client");
  const [otherSignerNames, setOtherSignerNames] = useState<string[]>([""]);
  const [signedDate, setSignedDate] = useState<Date | undefined>(new Date());
  const [digitalSignature, setDigitalSignature] = useState("");
  const [content, setContent] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [createdAgreementId, setCreatedAgreementId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState(branchId || "");
  
  // Determine the effective branch ID to use for queries
  const effectiveBranchId = isOrganizationLevel ? undefined : (branchId || selectedBranchId);
  
  // Fetch data
  const { data: branches, isLoading: branchesLoading } = useBranchNavigation();
  const { data: agreementTypes, isLoading: typesLoading } = useAgreementTypes();
  const { data: templates, isLoading: templatesLoading } = useAgreementTemplates({
    searchQuery: "",
    typeFilter: selectedType || "all",
    branchId: effectiveBranchId,
    isOrganizationLevel
  });
  const { data: clients, isLoading: clientsLoading } = useClients(effectiveBranchId);
  const { data: staff, isLoading: staffLoading } = useStaff(effectiveBranchId);
  
  const createAgreementMutation = useCreateAgreement();
  const createSignersMutation = useCreateSigners();
  const { workflowState, handleFileUpload, setSignature, resetWorkflow } = useAgreementWorkflow();
  
  const handleCreateAgreement = async () => {
    // Validation
    if (!title || !selectedType || !signedDate) {
      toast.error("Please fill in all required fields");
      return false;
    }

    // For organization-level, branch_id can be null
    // For branch-level, branch must be selected
    if (!isOrganizationLevel && !effectiveBranchId) {
      toast.error("Please select a branch");
      return false;
    }

    // Validate signers based on party type
    if (signingParty === "client" && selectedClients.length === 0) {
      toast.error("Please select at least one client");
      return false;
    }
    
    if (signingParty === "staff" && selectedStaff.length === 0) {
      toast.error("Please select at least one staff member");
      return false;
    }
    
    if (signingParty === "other") {
      const validNames = otherSignerNames.filter(name => name.trim() !== "");
      if (validNames.length === 0) {
        toast.error("Please enter at least one signer name");
        return false;
      }
    }
    
    try {
      // Create the agreement first
      const agreementData = {
        title,
        content: content || null,
        template_id: selectedTemplate || null,
        type_id: selectedType,
        status: "Pending" as const,
        signed_by_name: null, // No longer used
        signed_by_client_id: null, // No longer used
        signed_by_staff_id: null, // No longer used
        signing_party: signingParty,
        signed_at: signedDate.toISOString(),
        digital_signature: null,
        primary_document_id: null,
        signature_file_id: null,
        branch_id: isOrganizationLevel ? null : effectiveBranchId || null,
      };

      const newAgreement = await createAgreementMutation.mutateAsync(agreementData);
      
      if (!newAgreement?.id) {
        return false;
      }

      // Create signers based on party type
      const signersData: Array<{
        agreement_id: string;
        signer_type: 'client' | 'staff' | 'other';
        signer_id?: string;
        signer_name: string;
        signer_auth_user_id?: string;
      }> = [];

      if (signingParty === "client" && clients) {
        selectedClients.forEach(clientId => {
          const client = clients.find(c => c.id === clientId);
          if (client) {
            signersData.push({
              agreement_id: newAgreement.id,
              signer_type: 'client',
              signer_id: clientId,
              signer_name: `${client.first_name} ${client.last_name}`,
              signer_auth_user_id: client.auth_user_id || undefined,
            });
          }
        });
      } else if (signingParty === "staff" && staff) {
        selectedStaff.forEach(staffId => {
          const staffMember = staff.find(s => s.id === staffId);
          if (staffMember) {
            signersData.push({
              agreement_id: newAgreement.id,
              signer_type: 'staff',
              signer_id: staffId,
              signer_name: `${staffMember.first_name} ${staffMember.last_name}`,
              signer_auth_user_id: staffMember.auth_user_id || undefined,
            });
          }
        });
      } else if (signingParty === "other") {
        otherSignerNames.filter(name => name.trim() !== "").forEach(name => {
          signersData.push({
            agreement_id: newAgreement.id,
            signer_type: 'other',
            signer_name: name.trim(),
          });
        });
      }

      // Create all signers
      if (signersData.length > 0) {
        await createSignersMutation.mutateAsync(signersData);
      }

      setCreatedAgreementId(newAgreement.id);
      toast.success("Agreement created! You can now upload documents.");
      return true;
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
    setSelectedClients([]);
    setSelectedStaff([]);
    setSigningParty("client");
    setOtherSignerNames([""]);
    setSignedDate(new Date());
    setDigitalSignature("");
    setContent("");
    setCurrentStep(1);
    setCreatedAgreementId(null);
    setSelectedBranchId(branchId === "global" ? "" : branchId);
    resetWorkflow();
  };

  // Reset selections when signing party changes
  React.useEffect(() => {
    if (signingParty === "client") {
      setSelectedStaff([]);
      setOtherSignerNames([""]);
    } else if (signingParty === "staff") {
      setSelectedClients([]);
      setOtherSignerNames([""]);
    } else if (signingParty === "other") {
      setSelectedClients([]);
      setSelectedStaff([]);
    }
  }, [signingParty]);

  const isLoading = typesLoading || templatesLoading || clientsLoading || staffLoading || branchesLoading;

  const hasValidSigners = 
    (signingParty === "client" && selectedClients.length > 0) ||
    (signingParty === "staff" && selectedStaff.length > 0) ||
    (signingParty === "other" && otherSignerNames.some(name => name.trim() !== ""));

  const canProceedToStep2 = title && selectedType && hasValidSigners && signedDate && 
    (isOrganizationLevel || effectiveBranchId);
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
              {!isOrganizationLevel && !branchId && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select a branch to create this agreement for.
                  </AlertDescription>
                </Alert>
              )}

              {!isOrganizationLevel && !branchId && (
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
                  <label className="text-sm font-medium">
                    Clients <span className="text-red-500">*</span>
                  </label>
                  <MultiSelect
                    options={clients?.map(client => ({
                      label: `${client.first_name} ${client.last_name}`,
                      value: client.id,
                    })) || []}
                    selected={selectedClients}
                    onSelectionChange={setSelectedClients}
                    placeholder="Select clients"
                    emptyText="No clients found"
                    maxDisplay={3}
                    showSelectAll={true}
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedClients.length} client(s) selected
                  </p>
                </div>
              )}

              {signingParty === "staff" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Staff Members <span className="text-red-500">*</span>
                  </label>
                  <MultiSelect
                    options={staff?.map(member => ({
                      label: `${member.first_name} ${member.last_name}`,
                      value: member.id,
                    })) || []}
                    selected={selectedStaff}
                    onSelectionChange={setSelectedStaff}
                    placeholder="Select staff members"
                    emptyText="No staff members found"
                    maxDisplay={3}
                    showSelectAll={true}
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedStaff.length} staff member(s) selected
                  </p>
                </div>
              )}

              {signingParty === "other" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Signer Names <span className="text-red-500">*</span>
                  </label>
                  {otherSignerNames.map((name, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Signer ${index + 1} name`}
                        value={name}
                        onChange={(e) => {
                          const newNames = [...otherSignerNames];
                          newNames[index] = e.target.value;
                          setOtherSignerNames(newNames);
                        }}
                      />
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newNames = otherSignerNames.filter((_, i) => i !== index);
                            setOtherSignerNames(newNames);
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOtherSignerNames([...otherSignerNames, ""])}
                    className="w-full"
                  >
                    + Add Another Signer
                  </Button>
                </div>
              )}

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
