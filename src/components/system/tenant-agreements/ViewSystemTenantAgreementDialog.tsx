import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatSafeDate } from '@/lib/dateUtils';
import { formatCurrency } from '@/lib/utils';
import type { SystemTenantAgreement } from '@/types/systemTenantAgreements';
import {
  FileText,
  Building2,
  Users,
  CreditCard,
  Settings,
  Scale,
  FileSignature,
} from 'lucide-react';

interface ViewSystemTenantAgreementDialogProps {
  agreement: SystemTenantAgreement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewSystemTenantAgreementDialog: React.FC<ViewSystemTenantAgreementDialogProps> = ({
  agreement,
  open,
  onOpenChange,
}) => {
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Active: 'bg-green-500/10 text-green-700 dark:text-green-400',
      Pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      Expired: 'bg-red-500/10 text-red-700 dark:text-red-400',
      Terminated: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-500/10'}>
        {status}
      </Badge>
    );
  };

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
    if (!value || (typeof value === 'string' && !value.trim())) return null;
    
    return (
      <div className="grid grid-cols-3 gap-4 py-2 border-b last:border-b-0">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="col-span-2 text-sm">{value}</dd>
      </div>
    );
  };

  const calculateFinalAmount = () => {
    const price = agreement.price_amount || 0;
    const discount = agreement.discount_amount || 0;
    return price - discount;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agreement Details
          </DialogTitle>
          <DialogDescription>
            View complete tenant agreement information
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <Accordion type="multiple" defaultValue={["details"]} className="space-y-4">
            {/* Section 1: Agreement Details */}
            <AccordionItem value="details" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">Agreement Details</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <dl className="space-y-0">
                  <InfoRow label="Agreement Reference" value={agreement.agreement_reference} />
                  <InfoRow label="Tenant Organization" value={agreement.system_tenant_organizations?.name} />
                  <InfoRow label="Software/Service Name" value={agreement.software_service_name} />
                  <InfoRow label="Agreement Type" value={agreement.system_tenant_agreement_types?.name} />
                  <InfoRow label="Status" value={getStatusBadge(agreement.status)} />
                  <InfoRow label="Start Date" value={formatSafeDate(agreement.start_date, 'PPP', 'Not set')} />
                  <InfoRow label="Expiry Date" value={formatSafeDate(agreement.expiry_date, 'PPP', 'Not set')} />
                  <InfoRow label="Created Date" value={formatSafeDate(agreement.created_at, 'PPP', 'N/A')} />
                  <InfoRow label="Title" value={agreement.title} />
                  {agreement.content && (
                    <div className="py-2">
                      <dt className="text-sm font-medium text-muted-foreground mb-2">Content</dt>
                      <dd className="text-sm bg-muted/50 p-4 rounded-md max-h-48 overflow-y-auto">
                        {agreement.content}
                      </dd>
                    </div>
                  )}
                </dl>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Parties Information */}
            {(agreement.tenant_address || agreement.tenant_contact_person || 
              agreement.provider_company_name || agreement.provider_address) && (
              <AccordionItem value="parties" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold">Parties Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Tenant Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <InfoRow label="Organization" value={agreement.system_tenant_organizations?.name} />
                        <InfoRow label="Address" value={agreement.tenant_address} />
                        <InfoRow label="Contact Person" value={agreement.tenant_contact_person} />
                        <InfoRow label="Email" value={agreement.tenant_email} />
                        <InfoRow label="Phone" value={agreement.tenant_phone} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Provider Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <InfoRow label="Company Name" value={agreement.provider_company_name} />
                        <InfoRow label="Address" value={agreement.provider_address} />
                        <InfoRow label="Contact Person" value={agreement.provider_contact_person} />
                        <InfoRow label="Email" value={agreement.provider_email} />
                        <InfoRow label="Phone" value={agreement.provider_phone} />
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Section 3: Financial Terms */}
            {(agreement.subscription_plan || agreement.payment_terms || agreement.price_amount) && (
              <AccordionItem value="financial" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-semibold">Financial Terms</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <dl className="space-y-0">
                    <InfoRow label="Subscription Plan" value={agreement.subscription_plan} />
                    <InfoRow label="Payment Terms" value={agreement.payment_terms} />
                    <InfoRow 
                      label="Price/Fees" 
                      value={agreement.price_amount ? formatCurrency(agreement.price_amount, 'en-GB', agreement.currency || 'GBP') : null} 
                    />
                    <InfoRow 
                      label="Discount %" 
                      value={agreement.discount_percentage ? `${agreement.discount_percentage}%` : null} 
                    />
                    <InfoRow 
                      label="Discount Amount" 
                      value={agreement.discount_amount ? formatCurrency(agreement.discount_amount, 'en-GB', agreement.currency || 'GBP') : null} 
                    />
                    {(agreement.price_amount || agreement.discount_amount) && (
                      <InfoRow 
                        label="Final Amount" 
                        value={
                          <span className="font-semibold text-primary">
                            {formatCurrency(calculateFinalAmount(), 'en-GB', agreement.currency || 'GBP')}
                          </span>
                        } 
                      />
                    )}
                    <InfoRow label="Payment Mode" value={agreement.payment_mode} />
                    <InfoRow 
                      label="Late Payment Penalty" 
                      value={agreement.late_payment_penalty ? `${agreement.late_payment_penalty}%` : null} 
                    />
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}

            {(agreement.services_included || agreement.user_limitations || 
              agreement.support_maintenance || agreement.training_onboarding) && (
              <AccordionItem value="service" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-semibold">Service Scope</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <dl className="space-y-0">
                    {agreement.services_included && (
                      <div className="py-2 border-b">
                        <dt className="text-sm font-medium text-muted-foreground mb-2">Services Included</dt>
                        <dd className="text-sm whitespace-pre-wrap">{agreement.services_included}</dd>
                      </div>
                    )}
                    {agreement.user_limitations && (
                      <div className="py-2 border-b">
                        <dt className="text-sm font-medium text-muted-foreground mb-2">User Limitations</dt>
                        <dd className="text-sm whitespace-pre-wrap">{agreement.user_limitations}</dd>
                      </div>
                    )}
                    {agreement.support_maintenance && (
                      <div className="py-2 border-b">
                        <dt className="text-sm font-medium text-muted-foreground mb-2">Support & Maintenance</dt>
                        <dd className="text-sm whitespace-pre-wrap">{agreement.support_maintenance}</dd>
                      </div>
                    )}
                    {agreement.training_onboarding && (
                      <div className="py-2">
                        <dt className="text-sm font-medium text-muted-foreground mb-2">Training & Onboarding</dt>
                        <dd className="text-sm whitespace-pre-wrap">{agreement.training_onboarding}</dd>
                      </div>
                    )}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}

            {(agreement.confidentiality_clause || agreement.data_protection_privacy || 
              agreement.termination_clause || agreement.liability_indemnity || 
              agreement.governing_law || agreement.jurisdiction) && (
              <AccordionItem value="legal" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    <span className="font-semibold">Legal Terms</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <dl className="space-y-0">
                    {agreement.confidentiality_clause && (
                      <div className="py-2 border-b">
                        <dt className="text-sm font-medium text-muted-foreground mb-2">Confidentiality Clause</dt>
                        <dd className="text-sm whitespace-pre-wrap">{agreement.confidentiality_clause}</dd>
                      </div>
                    )}
                    {agreement.data_protection_privacy && (
                      <div className="py-2 border-b">
                        <dt className="text-sm font-medium text-muted-foreground mb-2">Data Protection & Privacy</dt>
                        <dd className="text-sm whitespace-pre-wrap">{agreement.data_protection_privacy}</dd>
                      </div>
                    )}
                    {agreement.termination_clause && (
                      <div className="py-2 border-b">
                        <dt className="text-sm font-medium text-muted-foreground mb-2">Termination Clause</dt>
                        <dd className="text-sm whitespace-pre-wrap">{agreement.termination_clause}</dd>
                      </div>
                    )}
                    {agreement.liability_indemnity && (
                      <div className="py-2 border-b">
                        <dt className="text-sm font-medium text-muted-foreground mb-2">Liability & Indemnity</dt>
                        <dd className="text-sm whitespace-pre-wrap">{agreement.liability_indemnity}</dd>
                      </div>
                    )}
                    <InfoRow label="Governing Law" value={agreement.governing_law} />
                    <InfoRow label="Jurisdiction" value={agreement.jurisdiction} />
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}

            {(agreement.signed_by_tenant || agreement.signed_by_system || 
              agreement.tenant_signature_date || agreement.system_signature_date) && (
              <AccordionItem value="signatures" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    <span className="font-semibold">Signatures</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Tenant Representative</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <InfoRow label="Representative" value={agreement.signed_by_tenant || 'Not signed'} />
                        <InfoRow 
                          label="Signature Date" 
                          value={formatSafeDate(agreement.tenant_signature_date, 'PPP', 'Not signed')} 
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Med-Infinite Representative</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <InfoRow label="Representative" value={agreement.signed_by_system || 'Not signed'} />
                        <InfoRow 
                          label="Signature Date" 
                          value={formatSafeDate(agreement.system_signature_date, 'PPP', 'Not signed')} 
                        />
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
