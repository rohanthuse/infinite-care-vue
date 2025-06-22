
import React from "react";

interface RecruitmentSectionProps {
  branchId: string;
  branchName?: string;
}

const RecruitmentSection: React.FC<RecruitmentSectionProps> = ({ branchId, branchName }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Recruitment & Jobs</h3>
          <p className="text-gray-600">Manage job postings and applications</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">Recruitment Management</div>
          <p className="text-gray-600">
            Job posting and application management features will be available here.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Branch: {branchName} (ID: {branchId})
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentSection;
