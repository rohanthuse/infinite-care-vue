import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SafeSelect, SafeSelectContent, SafeSelectItem, SafeSelectTrigger, SafeSelectValue } from "@/components/ui/safe-select";
import { Combobox } from "@/components/ui/combobox";
import { getSubscriptionLimit, formatSubscriptionPlan } from "@/lib/subscriptionLimits";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SystemTenantAgreementFileUpload } from "./SystemTenantAgreementFileUpload";
import { useSystemTenantAgreementFileUpload } from "@/hooks/useSystemTenantAgreementFileUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FileText, Users, CreditCard, Settings, Scale, Paperclip, PenTool } from "lucide-react";
import { useCreateSystemTenantAgreement } from "@/hooks/useSystemTenantAgreements";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedSignatureCanvas } from "@/components/agreements/EnhancedSignatureCanvas";
import { FileUploadDropzone } from "@/components/agreements/FileUploadDropzone";
import type { SystemTenantAgreementStatus, PaymentTerms, PaymentMode } from "@/types/systemTenantAgreements";

export function CreateSystemTenantAgreementDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const createAgreement = useCreateSystemTenantAgreement();
  const { uploadFile } = useSystemTenantAgreementFileUpload();

  // Dropdown data
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; subscription_plan: string | null; max_users: number }>>([]);
  const [agreementTypes, setAgreementTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; title: string }>>([]);
  const [createdAgreementId, setCreatedAgreementId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);

  // State slices to avoid TypeScript depth issues
  const [agreementDetails, setAgreementDetails] = useState<{
    agreement_reference: string;
    tenant_id: string;
    software_service_name: string;
    title: string;
    type_id: string;
    template_id: string;
    start_date: string;
    expiry_date: string;
    status: SystemTenantAgreementStatus;
    content: string;
  }>({
    agreement_reference: '',
    tenant_id: '',
    software_service_name: 'MED-INFINITE ENDLESS CARE',
    title: '',
    type_id: '',
    template_id: '',
    start_date: '',
    expiry_date: '',
    status: 'Draft',
    content: ''
  });

  const [tenantDetails, setTenantDetails] = useState<{
    name: string;
    address: string;
    contact_person: string;
    email: string;
    phone: string;
  }>({
    name: '',
    address: '',
    contact_person: '',
    email: '',
    phone: ''
  });

  const [providerDetails, setProviderDetails] = useState<{
    company_name: string;
    address: string;
    contact_person: string;
    email: string;
    phone: string;
  }>({
    company_name: 'MED-INFINITE ENDLESS CARE',
    address: 'Medical House, 123 Healthcare Street, London, UK',
    contact_person: 'System Administrator',
    email: 'contact@med-infinite.com',
    phone: '+44 20 1234 5678'
  });

  const [financialTerms, setFinancialTerms] = useState<{
    subscription_plan: string;
    payment_terms: PaymentTerms | '';
    price_amount: number;
    discount_percentage: number;
    discount_amount: number;
    payment_mode: PaymentMode | '';
    late_payment_penalty: string;
  }>({
    subscription_plan: '',
    payment_terms: '',
    price_amount: 0,
    discount_percentage: 0,
    discount_amount: 0,
    payment_mode: '',
    late_payment_penalty: ''
  });

  const [serviceScope, setServiceScope] = useState<{
    services_included: string;
    user_limitations: string;
    support_maintenance: string;
    training_onboarding: string;
  }>({
    services_included: '',
    user_limitations: '',
    support_maintenance: '',
    training_onboarding: ''
  });

  const [legalTerms, setLegalTerms] = useState<{
    confidentiality_clause: string;
    data_protection_privacy: string;
    termination_clause: string;
    liability_indemnity: string;
    governing_law: string;
    jurisdiction: string;
  }>({
    confidentiality_clause: '',
    data_protection_privacy: '',
    termination_clause: '',
    liability_indemnity: '',
    governing_law: 'United Kingdom',
    jurisdiction: 'England and Wales'
  });

  const [signatures, setSignatures] = useState<{
    tenant_representative: string;
    tenant_signature: string;
    tenant_signature_date: string;
    system_representative: string;
    system_signature: string;
    system_signature_date: string;
  }>({
    tenant_representative: '',
    tenant_signature: '',
    tenant_signature_date: '',
    system_representative: '',
    system_signature: '',
    system_signature_date: ''
  });

  // Calculate final amount
  const finalAmount = useMemo(() => {
    const price = financialTerms.price_amount || 0;
    const discountPct = financialTerms.discount_percentage || 0;
    const discountAmt = financialTerms.discount_amount || 0;
    
    const afterPct = price - (price * discountPct / 100);
    return Math.max(0, afterPct - discountAmt);
  }, [financialTerms.price_amount, financialTerms.discount_percentage, financialTerms.discount_amount]);

  // Fetch dropdown data when dialog opens
  useEffect(() => {
    const fetchDropdownData = async (): Promise<void> => {
      if (!open) return;
      
      try {
        // Fetch tenants
        // @ts-ignore - Known Supabase TypeScript depth issue
        const tenantsResult = await supabase
          .from('organizations')
          .select(`
            id, 
            name, 
            subscription_plan,
            subscription_plan_id,
            subscription_plans!organizations_subscription_plan_id_fkey (
              name,
              max_users
            )
          `)
          .order('name');
        
        const tenantsData: Array<{ id: string; name: string; subscription_plan: string | null; max_users: number }> = [];
        if (tenantsResult.data) {
          for (const item of tenantsResult.data) {
            const linkedPlan = item.subscription_plans as { name: string; max_users: number } | null;
            const maxUsers = linkedPlan?.max_users || getSubscriptionLimit(item.subscription_plan, null);
            const planName = linkedPlan?.name || item.subscription_plan;
            
            tenantsData.push({ 
              id: String(item.id), 
              name: String(item.name),
              subscription_plan: planName,
              max_users: maxUsers
            });
          }
        }
        setTenants(tenantsData);
        
        // Fetch agreement types
        // @ts-ignore - Known Supabase TypeScript depth issue
        const typesResult = await supabase
          .from('system_tenant_agreement_types')
          .select('id, name')
          .eq('status', 'Active')
          .order('name');
        
        const typesData: Array<{ id: string; name: string }> = [];
        if (typesResult.data) {
          for (const item of typesResult.data) {
            typesData.push({ id: String(item.id), name: String(item.name) });
          }
        }
        setAgreementTypes(typesData);
        console.log('Loaded agreement types:', typesData);
        
        // Fetch templates
        // @ts-ignore - Known Supabase TypeScript depth issue
        const templatesResult = await supabase
          .from('system_tenant_agreement_templates')
          .select('id, title')
          .order('title');
        
        const templatesData: Array<{ id: string; title: string }> = [];
        if (templatesResult.data) {
          for (const item of templatesResult.data) {
            templatesData.push({ id: String(item.id), title: String(item.title) });
          }
        }
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };
    
    fetchDropdownData();
  }, [open]);

  // Auto-generate agreement reference
  useEffect(() => {
    if (open && !agreementDetails.agreement_reference) {
      const generateReference = async () => {
        const year = new Date().getFullYear();
        const { count } = await supabase
          .from('system_tenant_agreements')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${year}-01-01`)
          .lte('created_at', `${year}-12-31`);
        
        const sequence = (count || 0) + 1;
        setAgreementDetails(prev => ({
          ...prev,
          agreement_reference: `AGR-${year}-${String(sequence).padStart(4, '0')}`
        }));
      };
      generateReference();
    }
  }, [open, agreementDetails.agreement_reference]);

  // Auto-fill tenant name when selected
  useEffect(() => {
    const fetchTenantName = async (): Promise<void> => {
      if (!agreementDetails.tenant_id) return;
      
      // @ts-ignore - Known Supabase TypeScript depth issue
      const result = await supabase
        .from('organizations')
        .select('name')
        .eq('id', agreementDetails.tenant_id)
        .single();
      
      if (result.data && result.data.name) {
        setTenantDetails(prev => ({ ...prev, name: String(result.data.name) }));
      }
    };
    
    fetchTenantName();
  }, [agreementDetails.tenant_id]);

  // Auto-fill from template
  useEffect(() => {
    const fetchTemplate = async (): Promise<void> => {
      if (!agreementDetails.template_id) return;
      
      // @ts-ignore - Known Supabase TypeScript depth issue
      const result = await supabase
        .from('system_tenant_agreement_templates')
        .select('title, content')
        .eq('id', agreementDetails.template_id)
        .single();
      
      if (result.data) {
        const templateTitle = String(result.data.title || '');
        const templateContent = String(result.data.content || '');
        setAgreementDetails(prev => ({
          ...prev,
          title: prev.title || templateTitle,
          content: templateContent
        }));
      }
    };
    
    fetchTemplate();
  }, [agreementDetails.template_id]);

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    // Required fields
    if (!agreementDetails.tenant_id) errors.push('Tenant is required');
    if (!agreementDetails.title) errors.push('Agreement title is required');
    if (!agreementDetails.type_id) errors.push('Agreement type is required');
    if (!agreementDetails.start_date) errors.push('Start date is required');
    if (!agreementDetails.expiry_date) errors.push('End date is required');
    
    // Date validation
    if (agreementDetails.start_date && agreementDetails.expiry_date) {
      const start = new Date(agreementDetails.start_date);
      const end = new Date(agreementDetails.expiry_date);
      if (end <= start) {
        errors.push('End date must be after start date');
      }
    }
    
    // Financial validation
    if (financialTerms.price_amount < 0) {
      errors.push('Price cannot be negative');
    }
    
    if (finalAmount < 0) {
      errors.push('Discounts cannot exceed price amount');
    }
    
    // Email validation
    if (tenantDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantDetails.email)) {
      errors.push('Invalid tenant email format');
    }
    if (providerDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerDetails.email)) {
      errors.push('Invalid provider email format');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get current user ID
      // @ts-ignore - Known Supabase TypeScript depth issue
      const { data: { user } } = await supabase.auth.getUser();
      
      // Combine all state slices
      const agreementData = {
        // Agreement Details
        agreement_reference: agreementDetails.agreement_reference,
        tenant_id: agreementDetails.tenant_id,
        software_service_name: agreementDetails.software_service_name,
        title: agreementDetails.title,
        type_id: agreementDetails.type_id || undefined,
        template_id: agreementDetails.template_id || undefined,
        start_date: agreementDetails.start_date,
        expiry_date: agreementDetails.expiry_date,
        status: agreementDetails.status,
        content: agreementDetails.content || undefined,
        
        // Tenant Details
        tenant_address: tenantDetails.address || undefined,
        tenant_contact_person: tenantDetails.contact_person || undefined,
        tenant_email: tenantDetails.email || undefined,
        tenant_phone: tenantDetails.phone || undefined,
        
        // Provider Details
        provider_company_name: providerDetails.company_name,
        provider_address: providerDetails.address || undefined,
        provider_contact_person: providerDetails.contact_person || undefined,
        provider_email: providerDetails.email || undefined,
        provider_phone: providerDetails.phone || undefined,
        
        // Financial
        subscription_plan: financialTerms.subscription_plan || undefined,
        payment_terms: financialTerms.payment_terms || undefined,
        price_amount: financialTerms.price_amount || undefined,
        currency: 'GBP',
        discount_percentage: financialTerms.discount_percentage || undefined,
        discount_amount: financialTerms.discount_amount || undefined,
        payment_mode: financialTerms.payment_mode || undefined,
        late_payment_penalty: financialTerms.late_payment_penalty || undefined,
        
        // Service Scope
        services_included: serviceScope.services_included || undefined,
        user_limitations: serviceScope.user_limitations || undefined,
        support_maintenance: serviceScope.support_maintenance || undefined,
        training_onboarding: serviceScope.training_onboarding || undefined,
        
        // Legal
        confidentiality_clause: legalTerms.confidentiality_clause || undefined,
        data_protection_privacy: legalTerms.data_protection_privacy || undefined,
        termination_clause: legalTerms.termination_clause || undefined,
        liability_indemnity: legalTerms.liability_indemnity || undefined,
        governing_law: legalTerms.governing_law || undefined,
        jurisdiction: legalTerms.jurisdiction || undefined,
        
        // Signatures
        signed_by_tenant: signatures.tenant_representative || undefined,
        tenant_digital_signature: signatures.tenant_signature || undefined,
        tenant_signature_date: signatures.tenant_signature_date || undefined,
        signed_by_system: signatures.system_representative || undefined,
        system_digital_signature: signatures.system_signature || undefined,
        system_signature_date: signatures.system_signature_date || undefined,
      };
      
      const result = await createAgreement.mutateAsync(agreementData);
      
      toast({
        title: 'Success',
        description: 'Agreement created successfully'
      });
      
      // Store created agreement ID and upload pending attachments
      if (result?.id) {
        setCreatedAgreementId(result.id);
        
        // Upload pending attachments
        if (pendingAttachments.length > 0) {
          try {
            for (const file of pendingAttachments) {
              await uploadFile(file, result.id, 'attachment');
            }
            setPendingAttachments([]);
            toast({
              title: 'Files Uploaded',
              description: `Successfully uploaded ${pendingAttachments.length} file(s)`
            });
          } catch (uploadError) {
            console.error('Error uploading attachments:', uploadError);
            toast({
              title: 'Partial Success',
              description: 'Agreement created but some attachments failed to upload',
              variant: 'destructive'
            });
          }
        }
      }
      
      resetForm();
      setOpen(false);
      
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create agreement',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = (): void => {
    setAgreementDetails({
      agreement_reference: '',
      tenant_id: '',
      software_service_name: 'MED-INFINITE ENDLESS CARE',
      title: '',
      type_id: '',
      template_id: '',
      start_date: '',
      expiry_date: '',
      status: 'Draft' as SystemTenantAgreementStatus,
      content: ''
    });
    setTenantDetails({ name: '', address: '', contact_person: '', email: '', phone: '' });
    setProviderDetails({
      company_name: 'MED-INFINITE ENDLESS CARE',
      address: 'Medical House, 123 Healthcare Street, London, UK',
      contact_person: 'System Administrator',
      email: 'contact@med-infinite.com',
      phone: '+44 20 1234 5678'
    });
    setFinancialTerms({
      subscription_plan: '',
      payment_terms: '' as PaymentTerms | '',
      price_amount: 0,
      discount_percentage: 0,
      discount_amount: 0,
      payment_mode: '' as PaymentMode | '',
      late_payment_penalty: ''
    });
    setServiceScope({
      services_included: '',
      user_limitations: '',
      support_maintenance: '',
      training_onboarding: ''
    });
    setLegalTerms({
      confidentiality_clause: '',
      data_protection_privacy: '',
      termination_clause: '',
      liability_indemnity: '',
      governing_law: 'United Kingdom',
      jurisdiction: 'England and Wales'
    });
    setSignatures({
      tenant_representative: '',
      tenant_signature: '',
      tenant_signature_date: '',
      system_representative: '',
      system_signature: '',
      system_signature_date: ''
    });
    setCreatedAgreementId(null);
    setPendingAttachments([]);
  };

  const handleCancel = (): void => {
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Agreement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Tenant Agreement</DialogTitle>
          <DialogDescription>
            Complete all sections to create a comprehensive tenant agreement
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <form className="space-y-4">
            <Accordion type="multiple" defaultValue={["details", "parties"]} className="space-y-2">
              
              {/* Section 1: Agreement Details */}
              <AccordionItem value="details" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Agreement Details</span>
                    <span className="text-red-500">*</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Agreement Reference</Label>
                      <Input
                        value={agreementDetails.agreement_reference}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    
                    <div>
                      <Label>Tenant Name <span className="text-red-500">*</span></Label>
                      <Combobox
                        options={tenants.map(tenant => ({
                          value: tenant.id,
                          label: tenant.name,
                          description: tenant.subscription_plan 
                            ? `${formatSubscriptionPlan(tenant.subscription_plan)} (${tenant.max_users} Users)`
                            : 'No Plan'
                        }))}
                        value={agreementDetails.tenant_id}
                        onValueChange={(value) => setAgreementDetails(prev => ({ ...prev, tenant_id: value || '' }))}
                        placeholder="Select tenant..."
                        searchPlaceholder="Search by tenant name or plan..."
                        emptyText={tenants.length === 0 ? "Loading tenants..." : "No tenants found"}
                      />
                    </div>
                    
                    <div>
                      <Label>Software/Service Name</Label>
                      <Input
                        value={agreementDetails.software_service_name}
                        onChange={(e) => setAgreementDetails(prev => ({ ...prev, software_service_name: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Agreement Type <span className="text-red-500">*</span></Label>
                      <SafeSelect
                        value={agreementDetails.type_id || undefined}
                        onValueChange={(value) => setAgreementDetails(prev => ({ ...prev, type_id: value || '' }))}
                      >
                        <SafeSelectTrigger>
                          <SafeSelectValue placeholder="Select type" />
                        </SafeSelectTrigger>
                        <SafeSelectContent>
                          {agreementTypes.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">Loading types...</div>
                          ) : (
                            agreementTypes.map(type => (
                              <SafeSelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SafeSelectItem>
                            ))
                          )}
                        </SafeSelectContent>
                      </SafeSelect>
                    </div>
                    
                    <div>
                      <Label>Template (Optional)</Label>
                      <SafeSelect
                        value={agreementDetails.template_id || undefined}
                        onValueChange={(value) => setAgreementDetails(prev => ({ ...prev, template_id: value || '' }))}
                      >
                        <SafeSelectTrigger>
                          <SafeSelectValue placeholder="Select template (optional)" />
                        </SafeSelectTrigger>
                        <SafeSelectContent>
                          {templates.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">No templates available</div>
                          ) : (
                            templates.map(template => (
                              <SafeSelectItem key={template.id} value={template.id}>
                                {template.title}
                              </SafeSelectItem>
                            ))
                          )}
                        </SafeSelectContent>
                      </SafeSelect>
                    </div>
                    
                    <div>
                      <Label>Status</Label>
                      <SafeSelect
                        value={agreementDetails.status || undefined}
                        onValueChange={(value) => setAgreementDetails(prev => ({ ...prev, status: value as SystemTenantAgreementStatus }))}
                      >
                        <SafeSelectTrigger>
                          <SafeSelectValue placeholder="Select status" />
                        </SafeSelectTrigger>
                        <SafeSelectContent>
                          <SafeSelectItem value="Draft">Draft</SafeSelectItem>
                          <SafeSelectItem value="Pending">Pending</SafeSelectItem>
                          <SafeSelectItem value="Active">Active</SafeSelectItem>
                          <SafeSelectItem value="Expired">Expired</SafeSelectItem>
                          <SafeSelectItem value="Terminated">Terminated</SafeSelectItem>
                        </SafeSelectContent>
                      </SafeSelect>
                    </div>
                    
                    <div>
                      <Label>Start Date <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={agreementDetails.start_date}
                        onChange={(e) => setAgreementDetails(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label>End Date <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={agreementDetails.expiry_date}
                        onChange={(e) => setAgreementDetails(prev => ({ ...prev, expiry_date: e.target.value }))}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label>Agreement Title <span className="text-red-500">*</span></Label>
                      <Input
                        value={agreementDetails.title}
                        onChange={(e) => setAgreementDetails(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter agreement title"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label>Agreement Content</Label>
                      <Textarea
                        value={agreementDetails.content}
                        onChange={(e) => setAgreementDetails(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Agreement content (auto-filled from template if selected)"
                        rows={4}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 2: Parties Information */}
              <AccordionItem value="parties" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Parties Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {/* Tenant Details Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Tenant Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Tenant Name</Label>
                          <Input
                            value={tenantDetails.name}
                            readOnly
                            className="bg-muted"
                            placeholder="Select tenant in Agreement Details"
                          />
                        </div>
                        <div>
                          <Label>Address</Label>
                          <Textarea
                            value={tenantDetails.address}
                            onChange={(e) => setTenantDetails(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Enter tenant address"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Contact Person</Label>
                          <Input
                            value={tenantDetails.contact_person}
                            onChange={(e) => setTenantDetails(prev => ({ ...prev, contact_person: e.target.value }))}
                            placeholder="Contact person name"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={tenantDetails.email}
                            onChange={(e) => setTenantDetails(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="contact@tenant.com"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            type="tel"
                            value={tenantDetails.phone}
                            onChange={(e) => setTenantDetails(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+44 20 1234 5678"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Provider Details Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Provider Details (MED-INFINITE)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Company Name</Label>
                          <Input
                            value={providerDetails.company_name}
                            onChange={(e) => setProviderDetails(prev => ({ ...prev, company_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Address</Label>
                          <Textarea
                            value={providerDetails.address}
                            onChange={(e) => setProviderDetails(prev => ({ ...prev, address: e.target.value }))}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Contact Person</Label>
                          <Input
                            value={providerDetails.contact_person}
                            onChange={(e) => setProviderDetails(prev => ({ ...prev, contact_person: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={providerDetails.email}
                            onChange={(e) => setProviderDetails(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            type="tel"
                            value={providerDetails.phone}
                            onChange={(e) => setProviderDetails(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 3: Financial Terms */}
              <AccordionItem value="financial" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold">Financial Terms</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Subscription Plan</Label>
                      <Input
                        value={financialTerms.subscription_plan}
                        onChange={(e) => setFinancialTerms(prev => ({ ...prev, subscription_plan: e.target.value }))}
                        placeholder="e.g., Enterprise, Professional"
                      />
                    </div>
                    
                    <div>
                      <Label>Payment Terms</Label>
                      <SafeSelect
                        value={financialTerms.payment_terms || undefined}
                        onValueChange={(value) => setFinancialTerms(prev => ({ ...prev, payment_terms: value as PaymentTerms }))}
                      >
                        <SafeSelectTrigger>
                          <SafeSelectValue placeholder="Select payment terms" />
                        </SafeSelectTrigger>
                        <SafeSelectContent>
                          <SafeSelectItem value="Monthly">Monthly</SafeSelectItem>
                          <SafeSelectItem value="Quarterly">Quarterly</SafeSelectItem>
                          <SafeSelectItem value="Yearly">Yearly</SafeSelectItem>
                        </SafeSelectContent>
                      </SafeSelect>
                    </div>
                    
                    <div>
                      <Label>Price/Fees (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={financialTerms.price_amount}
                        onChange={(e) => setFinancialTerms(prev => ({ ...prev, price_amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <Label>Discount (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={financialTerms.discount_percentage}
                        onChange={(e) => setFinancialTerms(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <Label>Discount Amount (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={financialTerms.discount_amount}
                        onChange={(e) => setFinancialTerms(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <Label>Payment Mode</Label>
                      <SafeSelect
                        value={financialTerms.payment_mode || undefined}
                        onValueChange={(value) => setFinancialTerms(prev => ({ ...prev, payment_mode: value as PaymentMode }))}
                      >
                        <SafeSelectTrigger>
                          <SafeSelectValue placeholder="Select payment mode" />
                        </SafeSelectTrigger>
                        <SafeSelectContent>
                          <SafeSelectItem value="Bank Transfer">Bank Transfer</SafeSelectItem>
                          <SafeSelectItem value="Credit Card">Credit Card</SafeSelectItem>
                          <SafeSelectItem value="Direct Debit">Direct Debit</SafeSelectItem>
                          <SafeSelectItem value="Cheque">Cheque</SafeSelectItem>
                        </SafeSelectContent>
                      </SafeSelect>
                    </div>
                    
                    <div className="col-span-2">
                      <Label>Late Payment Penalties</Label>
                      <Textarea
                        value={financialTerms.late_payment_penalty}
                        onChange={(e) => setFinancialTerms(prev => ({ ...prev, late_payment_penalty: e.target.value }))}
                        placeholder="Describe late payment penalties..."
                        rows={2}
                      />
                    </div>
                    
                    {/* Calculated Final Amount */}
                    <div className="col-span-2">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">Final Amount:</span>
                          <span className="text-2xl font-bold text-blue-700">
                            £{finalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 4: Service Scope */}
              <AccordionItem value="services" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Service Scope & Deliverables</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label>Services Included</Label>
                      <Textarea
                        value={serviceScope.services_included}
                        onChange={(e) => setServiceScope(prev => ({ ...prev, services_included: e.target.value }))}
                        placeholder="List all services included in this agreement..."
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <Label>User Limitations</Label>
                      <Textarea
                        value={serviceScope.user_limitations}
                        onChange={(e) => setServiceScope(prev => ({ ...prev, user_limitations: e.target.value }))}
                        placeholder="Specify user limits, concurrent users, etc..."
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label>Support & Maintenance</Label>
                      <Textarea
                        value={serviceScope.support_maintenance}
                        onChange={(e) => setServiceScope(prev => ({ ...prev, support_maintenance: e.target.value }))}
                        placeholder="Support hours, response times, maintenance windows..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Training/Onboarding</Label>
                      <Textarea
                        value={serviceScope.training_onboarding}
                        onChange={(e) => setServiceScope(prev => ({ ...prev, training_onboarding: e.target.value }))}
                        placeholder="Training sessions, onboarding support provided..."
                        rows={3}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 5: Legal Terms */}
              <AccordionItem value="legal" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-red-600" />
                    <span className="font-semibold">Legal Terms</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label>Confidentiality Clause</Label>
                      <Textarea
                        value={legalTerms.confidentiality_clause}
                        onChange={(e) => setLegalTerms(prev => ({ ...prev, confidentiality_clause: e.target.value }))}
                        placeholder="Confidentiality terms and obligations..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Data Protection & Privacy</Label>
                      <Textarea
                        value={legalTerms.data_protection_privacy}
                        onChange={(e) => setLegalTerms(prev => ({ ...prev, data_protection_privacy: e.target.value }))}
                        placeholder="GDPR compliance, data handling, privacy terms..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Termination Clause</Label>
                      <Textarea
                        value={legalTerms.termination_clause}
                        onChange={(e) => setLegalTerms(prev => ({ ...prev, termination_clause: e.target.value }))}
                        placeholder="Conditions for termination, notice periods..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Liability & Indemnity</Label>
                      <Textarea
                        value={legalTerms.liability_indemnity}
                        onChange={(e) => setLegalTerms(prev => ({ ...prev, liability_indemnity: e.target.value }))}
                        placeholder="Limitation of liability, indemnification..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Governing Law</Label>
                        <Input
                          value={legalTerms.governing_law}
                          onChange={(e) => setLegalTerms(prev => ({ ...prev, governing_law: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Jurisdiction</Label>
                        <Input
                          value={legalTerms.jurisdiction}
                          onChange={(e) => setLegalTerms(prev => ({ ...prev, jurisdiction: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 6: Attachments */}
              <AccordionItem value="attachments" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold">Attachments</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <SystemTenantAgreementFileUpload
                    agreementId={createdAgreementId || undefined}
                    category="attachment"
                    maxFiles={10}
                    pendingFiles={pendingAttachments}
                    onPendingFilesChange={setPendingAttachments}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Section 7: Signatures */}
              <AccordionItem value="signatures" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-indigo-600" />
                    <span className="font-semibold">Signatures</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {/* Tenant Signature Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Tenant Representative Signature</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Representative Name</Label>
                          <Input
                            value={signatures.tenant_representative}
                            onChange={(e) => setSignatures(prev => ({ ...prev, tenant_representative: e.target.value }))}
                            placeholder="Full name of tenant representative"
                          />
                        </div>
                        
                        <div>
                          <Label>Digital Signature</Label>
                          <EnhancedSignatureCanvas
                            onSignatureSave={(signature) => setSignatures(prev => ({ ...prev, tenant_signature: signature }))}
                            agreementId={createdAgreementId || undefined}
                          />
                        </div>
                        
                        <div>
                          <Label>Signature Date</Label>
                          <Input
                            type="date"
                            value={signatures.tenant_signature_date}
                            onChange={(e) => setSignatures(prev => ({ ...prev, tenant_signature_date: e.target.value }))}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Provider Signature Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Provider Representative Signature</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Representative Name</Label>
                          <Input
                            value={signatures.system_representative}
                            onChange={(e) => setSignatures(prev => ({ ...prev, system_representative: e.target.value }))}
                            placeholder="Full name of provider representative"
                          />
                        </div>
                        
                        <div>
                          <Label>Digital Signature</Label>
                          <EnhancedSignatureCanvas
                            onSignatureSave={(signature) => setSignatures(prev => ({ ...prev, system_signature: signature }))}
                            agreementId={createdAgreementId || undefined}
                          />
                        </div>
                        
                        <div>
                          <Label>Signature Date</Label>
                          <Input
                            type="date"
                            value={signatures.system_signature_date}
                            onChange={(e) => setSignatures(prev => ({ ...prev, system_signature_date: e.target.value }))}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </form>
        </ScrollArea>

        <DialogFooter className="border-t pt-4 mt-4">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Agreement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
