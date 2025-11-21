import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateSystemTenantAgreement, useSystemTenantAgreementTypes } from '@/hooks/useSystemTenantAgreements';
import type { SystemTenantAgreement, UpdateSystemTenantAgreementData } from '@/types/systemTenantAgreements';
import {
  FileText,
  Users,
  CreditCard,
  Settings,
  Scale,
  FileSignature,
} from 'lucide-react';

interface EditSystemTenantAgreementDialogProps {
  agreement: SystemTenantAgreement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Formats a date value for HTML date input (YYYY-MM-DD format)
 * @param dateValue - Date string, Date object, or null/undefined
 * @returns Formatted date string or empty string if invalid
 */
const formatDateForInput = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Extract year, month, day
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', dateValue, error);
    return '';
  }
};

export const EditSystemTenantAgreementDialog: React.FC<EditSystemTenantAgreementDialogProps> = ({
  agreement,
  open,
  onOpenChange,
}) => {
  const updateAgreement = useUpdateSystemTenantAgreement();
  const { data: agreementTypes = [] } = useSystemTenantAgreementTypes();

  // Agreement Details State
  const [agreementDetails, setAgreementDetails] = useState({
    agreement_reference: '',
    software_service_name: '',
    title: '',
    type_id: '',
    status: 'Active',
    start_date: '',
    expiry_date: '',
    content: '',
    currency: 'GBP',
  });

  // Tenant Details State
  const [tenantDetails, setTenantDetails] = useState({
    address: '',
    contact_person: '',
    email: '',
    phone: '',
  });

  // Provider Details State
  const [providerDetails, setProviderDetails] = useState({
    company_name: '',
    address: '',
    contact_person: '',
    email: '',
    phone: '',
  });

  // Financial Terms State
  const [financialTerms, setFinancialTerms] = useState({
    subscription_plan: '',
    payment_terms: '',
    price_amount: '',
    discount_percentage: '',
    discount_amount: '',
    payment_mode: '',
    late_payment_penalty: '',
  });

  // Service Scope State
  const [serviceScope, setServiceScope] = useState({
    services_included: '',
    user_limitations: '',
    support_maintenance: '',
    training_onboarding: '',
  });

  // Legal Terms State
  const [legalTerms, setLegalTerms] = useState({
    confidentiality_clause: '',
    data_protection_privacy: '',
    termination_clause: '',
    liability_indemnity: '',
    governing_law: '',
    jurisdiction: '',
  });

  // Signatures State
  const [signatures, setSignatures] = useState({
    tenant_representative: '',
    tenant_signature_date: '',
    system_representative: '',
    system_signature_date: '',
  });

  // Load agreement data when dialog opens
  useEffect(() => {
    if (agreement && open) {
      // Agreement Details
      setAgreementDetails({
        agreement_reference: agreement.agreement_reference || '',
        software_service_name: agreement.software_service_name || '',
        title: agreement.title || '',
        type_id: agreement.type_id || '',
        status: agreement.status || 'Active',
        start_date: formatDateForInput(agreement.start_date),
        expiry_date: formatDateForInput(agreement.expiry_date),
        content: agreement.content || '',
        currency: agreement.currency || 'GBP',
      });

      // Tenant Details
      setTenantDetails({
        address: agreement.tenant_address || '',
        contact_person: agreement.tenant_contact_person || '',
        email: agreement.tenant_email || '',
        phone: agreement.tenant_phone || '',
      });

      // Provider Details
      setProviderDetails({
        company_name: agreement.provider_company_name || '',
        address: agreement.provider_address || '',
        contact_person: agreement.provider_contact_person || '',
        email: agreement.provider_email || '',
        phone: agreement.provider_phone || '',
      });

      // Financial Terms
      setFinancialTerms({
        subscription_plan: agreement.subscription_plan || '',
        payment_terms: agreement.payment_terms || '',
        price_amount: agreement.price_amount?.toString() || '',
        discount_percentage: agreement.discount_percentage?.toString() || '',
        discount_amount: agreement.discount_amount?.toString() || '',
        payment_mode: agreement.payment_mode || '',
        late_payment_penalty: agreement.late_payment_penalty?.toString() || '',
      });

      // Service Scope
      setServiceScope({
        services_included: agreement.services_included || '',
        user_limitations: agreement.user_limitations || '',
        support_maintenance: agreement.support_maintenance || '',
        training_onboarding: agreement.training_onboarding || '',
      });

      // Legal Terms
      setLegalTerms({
        confidentiality_clause: agreement.confidentiality_clause || '',
        data_protection_privacy: agreement.data_protection_privacy || '',
        termination_clause: agreement.termination_clause || '',
        liability_indemnity: agreement.liability_indemnity || '',
        governing_law: agreement.governing_law || '',
        jurisdiction: agreement.jurisdiction || '',
      });

      // Signatures
      setSignatures({
        tenant_representative: agreement.signed_by_tenant || '',
        tenant_signature_date: formatDateForInput(agreement.tenant_signature_date),
        system_representative: agreement.signed_by_system || '',
        system_signature_date: formatDateForInput(agreement.system_signature_date),
      });
    }
  }, [agreement, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: UpdateSystemTenantAgreementData = {
      // Agreement Details
      agreement_reference: agreementDetails.agreement_reference || undefined,
      software_service_name: agreementDetails.software_service_name || undefined,
      title: agreementDetails.title,
      status: agreementDetails.status as any,
      start_date: agreementDetails.start_date || undefined,
      expiry_date: agreementDetails.expiry_date || undefined,
      content: agreementDetails.content || undefined,
      currency: agreementDetails.currency || undefined,

      // Tenant Details
      tenant_address: tenantDetails.address || undefined,
      tenant_contact_person: tenantDetails.contact_person || undefined,
      tenant_email: tenantDetails.email || undefined,
      tenant_phone: tenantDetails.phone || undefined,

      // Provider Details
      provider_company_name: providerDetails.company_name || undefined,
      provider_address: providerDetails.address || undefined,
      provider_contact_person: providerDetails.contact_person || undefined,
      provider_email: providerDetails.email || undefined,
      provider_phone: providerDetails.phone || undefined,

      // Financial Terms
      subscription_plan: financialTerms.subscription_plan || undefined,
      payment_terms: financialTerms.payment_terms || undefined,
      price_amount: financialTerms.price_amount ? Number(financialTerms.price_amount) : undefined,
      discount_percentage: financialTerms.discount_percentage ? Number(financialTerms.discount_percentage) : undefined,
      discount_amount: financialTerms.discount_amount ? Number(financialTerms.discount_amount) : undefined,
      payment_mode: financialTerms.payment_mode || undefined,
      late_payment_penalty: financialTerms.late_payment_penalty || undefined,

      // Service Scope
      services_included: serviceScope.services_included || undefined,
      user_limitations: serviceScope.user_limitations || undefined,
      support_maintenance: serviceScope.support_maintenance || undefined,
      training_onboarding: serviceScope.training_onboarding || undefined,

      // Legal Terms
      confidentiality_clause: legalTerms.confidentiality_clause || undefined,
      data_protection_privacy: legalTerms.data_protection_privacy || undefined,
      termination_clause: legalTerms.termination_clause || undefined,
      liability_indemnity: legalTerms.liability_indemnity || undefined,
      governing_law: legalTerms.governing_law || undefined,
      jurisdiction: legalTerms.jurisdiction || undefined,

      // Signatures
      signed_by_tenant: signatures.tenant_representative || undefined,
      tenant_signature_date: signatures.tenant_signature_date || undefined,
      signed_by_system: signatures.system_representative || undefined,
      system_signature_date: signatures.system_signature_date || undefined,
    };

    await updateAgreement.mutateAsync({ id: agreement.id, data: updateData });
    onOpenChange(false);
  };

  const calculateFinalAmount = () => {
    const price = parseFloat(financialTerms.price_amount) || 0;
    const discount = parseFloat(financialTerms.discount_amount) || 0;
    return (price - discount).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Agreement
          </DialogTitle>
          <DialogDescription>
            Update the tenant agreement details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto pr-4">
            <Accordion type="multiple" defaultValue={["details"]} className="space-y-4">
              {/* Section 1: Agreement Details */}
              <AccordionItem value="details" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-semibold">Agreement Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agreement_reference">Agreement Reference</Label>
                      <Input
                        id="agreement_reference"
                        value={agreementDetails.agreement_reference}
                        onChange={(e) => setAgreementDetails({ ...agreementDetails, agreement_reference: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="software_service_name">Software/Service Name</Label>
                      <Input
                        id="software_service_name"
                        value={agreementDetails.software_service_name}
                        onChange={(e) => setAgreementDetails({ ...agreementDetails, software_service_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Agreement Title *</Label>
                    <Input
                      id="title"
                      value={agreementDetails.title}
                      onChange={(e) => setAgreementDetails({ ...agreementDetails, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type_id">Agreement Type</Label>
                      <Select
                        value={agreementDetails.type_id}
                        onValueChange={(value) => setAgreementDetails({ ...agreementDetails, type_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {agreementTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={agreementDetails.status}
                        onValueChange={(value: any) => setAgreementDetails({ ...agreementDetails, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Expired">Expired</SelectItem>
                          <SelectItem value="Terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={agreementDetails.start_date}
                        onChange={(e) => setAgreementDetails({ ...agreementDetails, start_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiry_date">Expiry Date</Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={agreementDetails.expiry_date}
                        onChange={(e) => setAgreementDetails({ ...agreementDetails, expiry_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Agreement Content</Label>
                    <Textarea
                      id="content"
                      value={agreementDetails.content}
                      onChange={(e) => setAgreementDetails({ ...agreementDetails, content: e.target.value })}
                      rows={6}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 2: Parties Information */}
              <AccordionItem value="parties" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold">Parties Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tenant Details Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Tenant Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="tenant_address">Address</Label>
                          <Textarea
                            id="tenant_address"
                            value={tenantDetails.address}
                            onChange={(e) => setTenantDetails({ ...tenantDetails, address: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tenant_contact_person">Contact Person</Label>
                          <Input
                            id="tenant_contact_person"
                            value={tenantDetails.contact_person}
                            onChange={(e) => setTenantDetails({ ...tenantDetails, contact_person: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tenant_email">Email</Label>
                          <Input
                            id="tenant_email"
                            type="email"
                            value={tenantDetails.email}
                            onChange={(e) => setTenantDetails({ ...tenantDetails, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tenant_phone">Phone</Label>
                          <Input
                            id="tenant_phone"
                            value={tenantDetails.phone}
                            onChange={(e) => setTenantDetails({ ...tenantDetails, phone: e.target.value })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Provider Details Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Provider Details (Med-Infinite)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="provider_company_name">Company Name</Label>
                          <Input
                            id="provider_company_name"
                            value={providerDetails.company_name}
                            onChange={(e) => setProviderDetails({ ...providerDetails, company_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="provider_address">Address</Label>
                          <Textarea
                            id="provider_address"
                            value={providerDetails.address}
                            onChange={(e) => setProviderDetails({ ...providerDetails, address: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="provider_contact_person">Contact Person</Label>
                          <Input
                            id="provider_contact_person"
                            value={providerDetails.contact_person}
                            onChange={(e) => setProviderDetails({ ...providerDetails, contact_person: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="provider_email">Email</Label>
                          <Input
                            id="provider_email"
                            type="email"
                            value={providerDetails.email}
                            onChange={(e) => setProviderDetails({ ...providerDetails, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="provider_phone">Phone</Label>
                          <Input
                            id="provider_phone"
                            value={providerDetails.phone}
                            onChange={(e) => setProviderDetails({ ...providerDetails, phone: e.target.value })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 3: Financial Terms */}
              <AccordionItem value="financial" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-semibold">Financial Terms</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscription_plan">Subscription Plan</Label>
                      <Input
                        id="subscription_plan"
                        value={financialTerms.subscription_plan}
                        onChange={(e) => setFinancialTerms({ ...financialTerms, subscription_plan: e.target.value })}
                        placeholder="e.g., Monthly, Annual"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment_terms">Payment Terms</Label>
                      <Input
                        id="payment_terms"
                        value={financialTerms.payment_terms}
                        onChange={(e) => setFinancialTerms({ ...financialTerms, payment_terms: e.target.value })}
                        placeholder="e.g., Net 30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price_amount">Price/Fees ({agreementDetails.currency})</Label>
                      <Input
                        id="price_amount"
                        type="number"
                        step="0.01"
                        value={financialTerms.price_amount}
                        onChange={(e) => setFinancialTerms({ ...financialTerms, price_amount: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount_percentage">Discount %</Label>
                      <Input
                        id="discount_percentage"
                        type="number"
                        step="0.01"
                        value={financialTerms.discount_percentage}
                        onChange={(e) => setFinancialTerms({ ...financialTerms, discount_percentage: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount_amount">Discount Amount</Label>
                      <Input
                        id="discount_amount"
                        type="number"
                        step="0.01"
                        value={financialTerms.discount_amount}
                        onChange={(e) => setFinancialTerms({ ...financialTerms, discount_amount: e.target.value })}
                      />
                    </div>
                  </div>

                  {(financialTerms.price_amount || financialTerms.discount_amount) && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">Final Amount: <span className="text-primary text-lg">{agreementDetails.currency} {calculateFinalAmount()}</span></p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment_mode">Payment Mode</Label>
                      <Input
                        id="payment_mode"
                        value={financialTerms.payment_mode}
                        onChange={(e) => setFinancialTerms({ ...financialTerms, payment_mode: e.target.value })}
                        placeholder="e.g., Bank Transfer, Credit Card"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="late_payment_penalty">Late Payment Penalty %</Label>
                      <Input
                        id="late_payment_penalty"
                        type="number"
                        step="0.01"
                        value={financialTerms.late_payment_penalty}
                        onChange={(e) => setFinancialTerms({ ...financialTerms, late_payment_penalty: e.target.value })}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 4: Service Scope */}
              <AccordionItem value="service" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-semibold">Service Scope</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="services_included">Services Included</Label>
                    <Textarea
                      id="services_included"
                      value={serviceScope.services_included}
                      onChange={(e) => setServiceScope({ ...serviceScope, services_included: e.target.value })}
                      rows={4}
                      placeholder="List all services included in this agreement"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user_limitations">User Limitations</Label>
                    <Textarea
                      id="user_limitations"
                      value={serviceScope.user_limitations}
                      onChange={(e) => setServiceScope({ ...serviceScope, user_limitations: e.target.value })}
                      rows={3}
                      placeholder="Describe any user or usage limitations"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support_maintenance">Support & Maintenance</Label>
                    <Textarea
                      id="support_maintenance"
                      value={serviceScope.support_maintenance}
                      onChange={(e) => setServiceScope({ ...serviceScope, support_maintenance: e.target.value })}
                      rows={3}
                      placeholder="Describe support and maintenance terms"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="training_onboarding">Training & Onboarding</Label>
                    <Textarea
                      id="training_onboarding"
                      value={serviceScope.training_onboarding}
                      onChange={(e) => setServiceScope({ ...serviceScope, training_onboarding: e.target.value })}
                      rows={3}
                      placeholder="Describe training and onboarding provisions"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 5: Legal Terms */}
              <AccordionItem value="legal" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    <span className="font-semibold">Legal Terms</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confidentiality_clause">Confidentiality Clause</Label>
                    <Textarea
                      id="confidentiality_clause"
                      value={legalTerms.confidentiality_clause}
                      onChange={(e) => setLegalTerms({ ...legalTerms, confidentiality_clause: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_protection_privacy">Data Protection & Privacy</Label>
                    <Textarea
                      id="data_protection_privacy"
                      value={legalTerms.data_protection_privacy}
                      onChange={(e) => setLegalTerms({ ...legalTerms, data_protection_privacy: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="termination_clause">Termination Clause</Label>
                    <Textarea
                      id="termination_clause"
                      value={legalTerms.termination_clause}
                      onChange={(e) => setLegalTerms({ ...legalTerms, termination_clause: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="liability_indemnity">Liability & Indemnity</Label>
                    <Textarea
                      id="liability_indemnity"
                      value={legalTerms.liability_indemnity}
                      onChange={(e) => setLegalTerms({ ...legalTerms, liability_indemnity: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="governing_law">Governing Law</Label>
                      <Input
                        id="governing_law"
                        value={legalTerms.governing_law}
                        onChange={(e) => setLegalTerms({ ...legalTerms, governing_law: e.target.value })}
                        placeholder="e.g., Laws of England and Wales"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jurisdiction">Jurisdiction</Label>
                      <Input
                        id="jurisdiction"
                        value={legalTerms.jurisdiction}
                        onChange={(e) => setLegalTerms({ ...legalTerms, jurisdiction: e.target.value })}
                        placeholder="e.g., Courts of London"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 6: Signatures */}
              <AccordionItem value="signatures" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    <span className="font-semibold">Signatures</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tenant Signature */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Tenant Representative</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="tenant_representative">Representative Name</Label>
                          <Input
                            id="tenant_representative"
                            value={signatures.tenant_representative}
                            onChange={(e) => setSignatures({ ...signatures, tenant_representative: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tenant_signature_date">Signature Date</Label>
                          <Input
                            id="tenant_signature_date"
                            type="date"
                            value={signatures.tenant_signature_date}
                            onChange={(e) => setSignatures({ ...signatures, tenant_signature_date: e.target.value })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* System Signature */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Med-Infinite Representative</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="system_representative">Representative Name</Label>
                          <Input
                            id="system_representative"
                            value={signatures.system_representative}
                            onChange={(e) => setSignatures({ ...signatures, system_representative: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="system_signature_date">Signature Date</Label>
                          <Input
                            id="system_signature_date"
                            type="date"
                            value={signatures.system_signature_date}
                            onChange={(e) => setSignatures({ ...signatures, system_signature_date: e.target.value })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateAgreement.isPending}>
              {updateAgreement.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
