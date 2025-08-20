import { useParams } from 'react-router-dom';
import { BranchLayout } from '@/components/branch-dashboard/BranchLayout';
import { BranchAgreementsTab } from '@/components/agreements/BranchAgreementsTab';

const BranchAgreements = () => {
  const { id: branchId, branchName } = useParams<{ id: string; branchName: string }>();
  
  if (!branchId || !branchName) {
    return <div>Branch not found</div>;
  }

  const decodedBranchName = decodeURIComponent(branchName);

  return (
    <BranchLayout>
      <BranchAgreementsTab branchId={branchId} branchName={decodedBranchName} />
    </BranchLayout>
  );
};

export default BranchAgreements;