
import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface Note {
  date: Date;
  author: string;
  content: string;
}

interface CarerClientNotesTabProps {
  clientId: string;
}

export const CarerClientNotesTab: React.FC<CarerClientNotesTabProps> = ({ clientId }) => {
  // Mock notes - in a real app these would be fetched based on clientId
  const notes: Note[] = [
    { 
      date: new Date("2023-11-08"), 
      author: "Nurse David Brown", 
      content: "Patient reported mild discomfort in left knee. Applied cold compress and recommended rest. Will monitor." 
    },
    { 
      date: new Date("2023-11-01"), 
      author: "Dr. Sarah Johnson", 
      content: "Blood pressure readings have improved with current medication. Continuing current dosage and monitoring." 
    },
    { 
      date: new Date("2023-10-20"), 
      author: "Carer Emma Lewis", 
      content: "Client has been adhering well to diabetes management plan. Blood glucose levels stable." 
    },
  ];
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <span>Client Notes</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {notes.map((note, index) => (
            <div key={index} className="flex space-x-4">
              <Avatar className="h-9 w-9 bg-blue-100 text-blue-700">
                <div className="text-xs font-medium">{getInitials(note.author)}</div>
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">{note.author}</p>
                    <p className="text-xs text-gray-500">{format(note.date, "MMM d, yyyy")}</p>
                  </div>
                  <p className="text-gray-700">{note.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
