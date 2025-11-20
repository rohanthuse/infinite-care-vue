import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Users, CreditCard, Settings, Scale, PenTool, Plus } from "lucide-react";
import { useSystemTenantAgreementTypes, useSystemTenantAgreementTemplates, useCreateSystemTenantAgreement } from "@/hooks/useSystemTenantAgreements";
import { CreateSystemTenantAgreementData } from "@/types/systemTenantAgreements";

export function CreateSystemTenantAgreementDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: types } = useSystemTenantAgreementTypes();
  const { data: templates } = useSystemTenantAgreementTemplates();
  const createAgreement = useCreateSystemTenantAgreement();

  const [formData, setFormData] = useState<CreateSystemTenantAgreementData>({
    tenant_id: '',
    title: '',
    content: '',
    template_id: '',
    type_id: '',
    status: 'Draft',
    agreement_reference: '',
    software_service_name: 'MED-INFINITE ENDLESS CARE',
    start_date: '',
    expiry_date: '',
    tenant_address: '',
    tenant_contact_person: '',
    tenant_email: '',
    tenant_phone: '',
    provider_company_name: 'MED-INFINITE ENDLESS CARE',
    provider_address: '',
    provider_contact_person: '',
    provider_email: '',
    provider_phone: '',
    subscription_plan: '',
    payment_terms: '',
    price_amount: 0,
    currency: 'GBP',
    discount_percentage: 0,
    discount_amount: 0,
    payment_mode: '',
    late_payment_penalty: '',
    services_included: '',
    user_limitations: '',
    support_maintenance: '',
    training_onboarding: '',
    confidentiality_clause: '',
    data_protection_privacy: '',
    termination_clause: '',
    liability_indemnity: '',
    governing_law: 'United Kingdom',
    jurisdiction: 'England and Wales',
    signed_by_tenant: '',
    signed_by_system: '',
    tenant_signature_date: '',
    system_signature_date: '',
    tenant_digital_signature: '',
    system_digital_signature: '',
  });

  const { data: tenants } = useQuery({
    queryKey: ['system-tenants-for-agreements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('type', 'tenant')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (open && !formData.agreement_reference) {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setFormData(prev => ({ ...prev, agreement_reference: `AGR-${year}-${randomNum}` }));
    }
  }, [open, formData.agreement_reference]);

  useEffect(() => {
    if (formData.template_id && templates) {
      const template = templates.find(t => t.id === formData.template_id);
      if (template) {
        setFormData(prev => ({
          ...prev,
          content: template.content || '',
          type_id: template.type_id || '',
        }));
      }
    }
  }, [formData.template_id, templates]);

  const calculateFinalAmount = () => {
    const price = formData.price_amount || 0;
    const discountPct = formData.discount_percentage || 0;
    const discountAmt = formData.discount_amount || 0;
    
    const afterPctDiscount = price - (price * discountPct / 100);
    const finalAmount = afterPctDiscount - discountAmt;
    
    return Math.max(0, finalAmount);
  };

  const handleSubmit = async () => {
    if (!formData.tenant_id || !formData.title) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAgreement.mutateAsync(formData);
      setOpen(false);
      setFormData({
        tenant_id: '',
        title: '',
        content: '',
        template_id: '',
        type_id: '',
        status: 'Draft',
        agreement_reference: '',
        software_service_name: 'MED-INFINITE ENDLESS CARE',
        start_date: '',
        expiry_date: '',
        tenant_address: '',
        tenant_contact_person: '',
        tenant_email: '',
        tenant_phone: '',
        provider_company_name: 'MED-INFINITE ENDLESS CARE',
        provider_address: '',
        provider_contact_person: '',
        provider_email: '',
        provider_phone: '',
        subscription_plan: '',
        payment_terms: '',
        price_amount: 0,
        currency: 'GBP',
        discount_percentage: 0,
        discount_amount: 0,
        payment_mode: '',
        late_payment_penalty: '',
        services_included: '',
        user_limitations: '',
        support_maintenance: '',
        training_onboarding: '',
        confidentiality_clause: '',
        data_protection_privacy: '',
        termination_clause: '',
        liability_indemnity: '',
        governing_law: 'United Kingdom',
        jurisdiction: 'England and Wales',
        signed_by_tenant: '',
        signed_by_system: '',
        tenant_signature_date: '',
        system_signature_date: '',
        tenant_digital_signature: '',
        system_digital_signature: '',
      });
    } catch (error) {
      console.error('Error creating agreement:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Agreement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Tenant Agreement</DialogTitle>
          <DialogDescription>
            Create a comprehensive agreement with full contract details, financial terms, and legal clauses
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <Accordion type="multiple" defaultValue={["details", "parties"]} className="space-y-2">
            
            {/* Agreement Details */}
            <AccordionItem value="details" className="border rounded-lg px-4">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Agreement Details
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Agreement Reference</Label>
                    <Input
                      value={formData.agreement_reference || ''}
                      onChange={(e) => setFormData({...formData, agreement_reference: e.target.value})}
                      placeholder="Auto-generated"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tenant Organization *</Label>
                    <Select value={formData.tenant_id} onValueChange={(value) => setFormData({...formData, tenant_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants?.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label>Agreement Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Enter agreement title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Software/Service Name</Label>
                    <Input
                      value={formData.software_service_name || ''}
                      onChange={(e) => setFormData({...formData, software_service_name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Agreement Type</Label>
                    <Select value={formData.type_id || ''} onValueChange={(value) => setFormData({...formData, type_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types?.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date || ''}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Date / Renewal Date</Label>
                    <Input
                      type="date"
                      value={formData.expiry_date || ''}
                      onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status || 'Draft'} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                        <SelectItem value="Terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Use Template (Optional)</Label>
                    <Select value={formData.template_id || ''} onValueChange={(value) => setFormData({...formData, template_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label>Agreement Content</Label>
                    <Textarea
                      value={formData.content || ''}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="Enter agreement content or select a template"
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Parties Information */}
            <AccordionItem value="parties" className="border rounded-lg px-4">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Parties Information
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Tenant Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>Address</Label>
                        <Textarea
                          value={formData.tenant_address || ''}
                          onChange={(e) => setFormData({...formData, tenant_address: e.target.value})}
                          placeholder="Tenant address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Person</Label>
                        <Input
                          value={formData.tenant_contact_person || ''}
                          onChange={(e) => setFormData({...formData, tenant_contact_person: e.target.value})}
                          placeholder="Contact person name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={formData.tenant_email || ''}
                          onChange={(e) => setFormData({...formData, tenant_email: e.target.value})}
                          placeholder="contact@tenant.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={formData.tenant_phone || ''}
                          onChange={(e) => setFormData({...formData, tenant_phone: e.target.value})}
                          placeholder="+44 20 1234 5678"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Provider Details (MED-INFINITE)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>Company Name</Label>
                        <Input
                          value={formData.provider_company_name || ''}
                          onChange={(e) => setFormData({...formData, provider_company_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Address</Label>
                        <Textarea
                          value={formData.provider_address || ''}
                          onChange={(e) => setFormData({...formData, provider_address: e.target.value})}
                          placeholder="Provider address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Person</Label>
                        <Input
                          value={formData.provider_contact_person || ''}
                          onChange={(e) => setFormData({...formData, provider_contact_person: e.target.value})}
                          placeholder="Contact person name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={formData.provider_email || ''}
                          onChange={(e) => setFormData({...formData, provider_email: e.target.value})}
                          placeholder="contact@provider.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={formData.provider_phone || ''}
                          onChange={(e) => setFormData({...formData, provider_phone: e.target.value})}
                          placeholder="+44 20 1234 5678"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Financial Terms */}
            <AccordionItem value="financial" className="border rounded-lg px-4">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Financial Terms
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Subscription Plan / Package</Label>
                    <Input
                      value={formData.subscription_plan || ''}
                      onChange={(e) => setFormData({...formData, subscription_plan: e.target.value})}
                      placeholder="Enter subscription plan"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select value={formData.payment_terms || ''} onValueChange={(value) => setFormData({...formData, payment_terms: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Price / Fees</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_amount || ''}
                        onChange={(e) => setFormData({...formData, price_amount: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                      />
                      <Select value={formData.currency || 'GBP'} onValueChange={(value) => setFormData({...formData, currency: value})}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percentage || ''}
                      onChange={(e) => setFormData({...formData, discount_percentage: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Discount Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount_amount || ''}
                      onChange={(e) => setFormData({...formData, discount_amount: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Final Amount</Label>
                    <Input
                      value={`${formData.currency || 'GBP'} ${calculateFinalAmount().toFixed(2)}`}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={formData.payment_mode || ''} onValueChange={(value) => setFormData({...formData, payment_mode: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Direct Debit">Direct Debit</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label>Late Payment Penalties (Optional)</Label>
                    <Textarea
                      value={formData.late_payment_penalty || ''}
                      onChange={(e) => setFormData({...formData, late_payment_penalty: e.target.value})}
                      placeholder="Describe late payment penalties"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Service Scope */}
            <AccordionItem value="services" className="border rounded-lg px-4">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Service Scope & Deliverables
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Services Included</Label>
                    <Textarea
                      value={formData.services_included || ''}
                      onChange={(e) => setFormData({...formData, services_included: e.target.value})}
                      placeholder="List all services included in this agreement"
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>User Limitations</Label>
                    <Input
                      value={formData.user_limitations || ''}
                      onChange={(e) => setFormData({...formData, user_limitations: e.target.value})}
                      placeholder="e.g., Up to 50 users"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Support & Maintenance</Label>
                    <Textarea
                      value={formData.support_maintenance || ''}
                      onChange={(e) => setFormData({...formData, support_maintenance: e.target.value})}
                      placeholder="Describe support and maintenance terms"
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Training / Onboarding</Label>
                    <Textarea
                      value={formData.training_onboarding || ''}
                      onChange={(e) => setFormData({...formData, training_onboarding: e.target.value})}
                      placeholder="Describe training and onboarding services"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Legal Terms */}
            <AccordionItem value="legal" className="border rounded-lg px-4">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Legal Terms
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Confidentiality Clause</Label>
                    <Textarea
                      value={formData.confidentiality_clause || ''}
                      onChange={(e) => setFormData({...formData, confidentiality_clause: e.target.value})}
                      placeholder="Enter confidentiality terms"
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Data Protection & Privacy</Label>
                    <Textarea
                      value={formData.data_protection_privacy || ''}
                      onChange={(e) => setFormData({...formData, data_protection_privacy: e.target.value})}
                      placeholder="Enter data protection and privacy terms"
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Termination Clause</Label>
                    <Textarea
                      value={formData.termination_clause || ''}
                      onChange={(e) => setFormData({...formData, termination_clause: e.target.value})}
                      placeholder="Enter termination terms"
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Liability & Indemnity</Label>
                    <Textarea
                      value={formData.liability_indemnity || ''}
                      onChange={(e) => setFormData({...formData, liability_indemnity: e.target.value})}
                      placeholder="Enter liability and indemnity terms"
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Governing Law</Label>
                      <Input
                        value={formData.governing_law || ''}
                        onChange={(e) => setFormData({...formData, governing_law: e.target.value})}
                        placeholder="United Kingdom"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Jurisdiction</Label>
                      <Input
                        value={formData.jurisdiction || ''}
                        onChange={(e) => setFormData({...formData, jurisdiction: e.target.value})}
                        placeholder="England and Wales"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Signatures */}
            <AccordionItem value="signatures" className="border rounded-lg px-4">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-primary" />
                  Signatures
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Tenant Representative</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Representative Name</Label>
                        <Input
                          value={formData.signed_by_tenant || ''}
                          onChange={(e) => setFormData({...formData, signed_by_tenant: e.target.value})}
                          placeholder="Tenant representative name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Signature Date</Label>
                        <Input
                          type="date"
                          value={formData.tenant_signature_date || ''}
                          onChange={(e) => setFormData({...formData, tenant_signature_date: e.target.value})}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">MED-INFINITE Representative</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Representative Name</Label>
                        <Input
                          value={formData.signed_by_system || ''}
                          onChange={(e) => setFormData({...formData, signed_by_system: e.target.value})}
                          placeholder="Provider representative name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Signature Date</Label>
                        <Input
                          type="date"
                          value={formData.system_signature_date || ''}
                          onChange={(e) => setFormData({...formData, system_signature_date: e.target.value})}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createAgreement.isPending}>
            {createAgreement.isPending ? 'Creating...' : 'Create Agreement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
