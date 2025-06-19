
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarePlanDetail } from "@/components/care/CarePlanDetail";
import { useCarePlanData } from "@/hooks/useCarePlanData";
import { useClientPersonalCare } from "@/hooks/useClientPersonalCare";

export default function CarePlanView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [scheduleFollowUpDialogOpen, setScheduleFollowUpDialogOpen] = useState(false);
  const [recordActivityDialogOpen, setRecordActivityDialogOpen] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);

  // Fetch care plan data
  const { data: carePlan, isLoading, error } = useCarePlanData(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading care plan...</p>
        </div>
      </div>
    );
  }

  if (error || !carePlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Care Plan Not Found</h2>
          <p className="text-gray-600 mb-4">The requested care plan could not be found.</p>
          <Button onClick={() => navigate("/care")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Care Plans
          </Button>
        </div>
      </div>
    );
  }

  const handleAddNote = () => {
    setAddNoteDialogOpen(true);
  };

  const handleScheduleFollowUp = () => {
    setScheduleFollowUpDialogOpen(true);
  };

  const handleRecordActivity = () => {
    setRecordActivityDialogOpen(true);
  };

  const handleUploadDocument = () => {
    setUploadDocumentDialogOpen(true);
  };

  const handleAddEvent = () => {
    setAddEventDialogOpen(true);
  };

  const handleClose = () => {
    navigate("/care");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Care Plans
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Care Plan Details
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CarePlanDetail
          carePlan={carePlan}
          onClose={handleClose}
          onAddNote={handleAddNote}
          onScheduleFollowUp={handleScheduleFollowUp}
          onRecordActivity={handleRecordActivity}
          onUploadDocument={handleUploadDocument}
          onAddEvent={handleAddEvent}
        />
      </div>
    </div>
  );
}
