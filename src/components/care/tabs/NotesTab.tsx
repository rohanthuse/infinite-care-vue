
import React from "react";
import { format } from "date-fns";
import { MessageCircle, Clock, User, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Note {
  date: Date;
  author: string;
  content: string;
}

interface NotesTabProps {
  notes: Note[];
  onAddNote?: () => void;
}

// Helper function to extract role from author field
const extractRoleFromAuthor = (author: string): string => {
  // If author contains "Admin", "Carer", or other role indicators, extract them
  if (author === "Admin") return "Admin";
  if (author === "Carer") return "Carer";
  if (author.includes("Admin")) return "Admin";
  if (author.includes("Carer")) return "Carer";
  
  // Default fallback
  return "Staff";
};

export const NotesTab: React.FC<NotesTabProps> = ({ notes, onAddNote }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Care Notes</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onAddNote}>
              <Plus className="h-4 w-4" />
              <span>Add Note</span>
            </Button>
          </div>
          <CardDescription>Clinical observations and updates</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No notes available</p>
              </div>
            ) : (
              notes.map((note, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-white"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-xs">
                        {note.author.split(' ').map(n => n[0]).join('')}
                      </div>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-900">{note.author}</h3>
                          <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {extractRoleFromAuthor(note.author)}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(note.date, 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <p className="text-gray-700">{note.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
