
import React from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Form } from '@/types/form-builder';
import { BackButton } from '@/components/navigation/BackButton';

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
        <BackButton 
          onClick={handleBack}
          label="Back"
          variant="outline"
        />
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <Home className="h-4 w-4 mr-1" /> Dashboard
        </Button>
      </div>
    </div>
  );
};
