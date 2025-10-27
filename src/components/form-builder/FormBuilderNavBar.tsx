
import React from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Home } from 'lucide-react';
import { Form } from '@/types/form-builder';

interface FormBuilderNavBarProps {
  form: Form;
}

export const FormBuilderNavBar: React.FC<FormBuilderNavBarProps> = ({
  form,
}) => {
  const navigate = useNavigate();
  const { id: branchId, branchName } = useParams<{ id: string; branchName: string }>();
  const [searchParams] = useSearchParams();
  const { tenantSlug } = useTenant();

  const handleBack = () => {
    const source = searchParams.get('source');
    
    if (source === 'forms') {
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}/forms`
        : `/branch-dashboard/${branchId}/${branchName}/forms`;
      navigate(fullPath);
    } else if (source === 'workflow') {
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}/workflow`
        : `/branch-dashboard/${branchId}/${branchName}/workflow`;
      navigate(fullPath);
    } else {
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}`
        : `/branch-dashboard/${branchId}/${branchName}`;
      navigate(fullPath);
    }
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <Home className="h-4 w-4 mr-1" /> Dashboard
        </Button>
      </div>
    </div>
  );
};
