
import React from "react";
import { format, parseISO } from "date-fns";
import { Award } from "lucide-react";
import { Training } from "@/types/training";

interface TrainingCertificateViewProps {
  training: Training;
  staffName: string;
  staffId: string;
}

const TrainingCertificateView: React.FC<TrainingCertificateViewProps> = ({
  training,
  staffName,
  staffId
}) => {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return format(parseISO(dateString), 'MMMM d, yyyy');
  };

  return (
    <div className="border-8 border-blue-100 p-8 bg-white">
      <div className="text-center space-y-4">
        <div className="text-blue-600">
          <Award className="h-16 w-16 mx-auto" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Certificate of Completion</h2>
          <p className="text-gray-500">This certifies that</p>
          <p className="text-xl font-bold mt-2 text-gray-800">
            {staffName}
          </p>
          <p className="text-gray-500 mt-4">has successfully completed the course</p>
          <p className="text-xl font-bold my-2 text-gray-800">{training.title}</p>
          <p className="text-gray-500">on {formatDate(training.completionDate)}</p>
          
          {training.score !== undefined && (
            <p className="mt-4 text-gray-700">
              with a score of <span className="font-bold">{training.score}%</span>
            </p>
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-500">Certificate ID: {training.id}-{staffId}</p>
            <p className="text-gray-500">Valid until: {formatDate(training.expiryDate)}</p>
          </div>
          
          <div className="mt-6">
            <p className="font-bold text-gray-700">Med-Infinite Training Academy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingCertificateView;
