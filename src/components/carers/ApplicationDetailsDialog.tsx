import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, MailIcon, MapPin, Phone, XCircle, Download, Clock, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApplicationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
}

export const ApplicationDetailsDialog = ({ isOpen, onClose, candidate }: ApplicationDetailsDialogProps) => {
  const [adminNotes, setAdminNotes] = useState("");
  const [applicationStatus, setApplicationStatus] = useState("pending");
  const { toast } = useToast();

  if (!candidate) return null;

  const handleStatusChange = (status: string) => {
    setApplicationStatus(status);
    
    const statusMessages = {
      approved: "Application approved! An offer will be prepared.",
      rejected: "Application has been rejected.",
      interview: "Candidate has been moved to the interview stage.",
      assessment: "Candidate has been moved to the assessment stage."
    };
    
    const message = statusMessages[status] || "Application status updated.";
    
    toast({
      title: "Status Updated",
      description: message,
      variant: "default",
    });
  };

  const handleSaveNotes = () => {
    toast({
      title: "Notes Saved",
      description: "Admin notes have been saved successfully.",
      variant: "default",
    });
  };

  // Mock data - this would come from the API in a real application
  const mockExperience = {
    previousEmployment: "St. Mary's Hospital",
    keySkills: ["Patient Care", "Medication Administration", "Documentation"],
    education: "Bachelor of Nursing (BSc)",
    certifications: ["CPR Certification", "ACLS", "Wound Care Certification"]
  };
  
  const mockDocuments = [
    { name: "Resume.pdf", size: "1.2 MB", type: "application/pdf" },
    { name: "Cover Letter.docx", size: "842 KB", type: "application/msword" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="text-sm breadcrumbs">
              <ul className="flex space-x-2">
                <li>Dashboard</li>
                <span className="mx-1">›</span>
                <li>Recruitment</li>
                <span className="mx-1">›</span>
                <li>Application Details</li>
              </ul>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold">
            Application Details for {candidate.name}
          </DialogTitle>
          <DialogDescription>
            Review the candidate's application details, update status, and add admin notes. This dialog provides comprehensive information about the applicant.
          </DialogDescription>
        </DialogHeader>

        {/* Note: This component is deprecated. Use ApplicationDetailsPage instead */}
      </DialogContent>
    </Dialog>
  );
};
