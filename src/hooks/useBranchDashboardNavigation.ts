
import { useParams } from 'react-router-dom';

export const useBranchDashboardNavigation = () => {
  const { id, branchName } = useParams<{ id: string; branchName: string }>();

  return {
    id,
    branchName: branchName ? decodeURIComponent(branchName) : undefined
  };
};
