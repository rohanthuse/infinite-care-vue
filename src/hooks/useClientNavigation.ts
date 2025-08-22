import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

export const useClientNavigation = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  const createClientPath = (path: string) => {
    if (tenantSlug) {
      return `/${tenantSlug}/client-dashboard${path}`;
    }
    return `/client-dashboard${path}`;
  };

  const navigateToClientPage = (path: string, state?: any) => {
    navigate(createClientPath(path), state ? { state } : undefined);
  };

  return {
    createClientPath,
    navigateToClientPage,
    tenantSlug
  };
};