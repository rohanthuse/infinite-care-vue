
import React, { useState } from "react";
import { format } from "date-fns";
import { MessageCircle, Clock, User, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AddNoteDialog } from "../dialogs/AddNoteDialog";
import { useClientNotes, useCreateClientNote } from "@/hooks/useClientNotes";

interface NotesTabProps {
  clientId: string;
  notes?: any[];
}

export const NotesTab: React.FC<NotesTabProps> = ({ clientId }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { data: notes = [], isLoading } = useClientNotes(clientId);
  const createNoteMutation = useCreateClientNote();

  const handleAddNote = async (noteData: { title: string; content: string }) => {
    await createNoteMutation.mutateAsync({
      client_id: clientId,
      title: noteData.title,
      content: noteData.content,
      author: "Current User", // This should be replaced with actual user info
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Client Notes</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Add Note</span>
            </Button>
          </div>
          <CardDescription>Clinical observations and updates for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No notes available for this client</p>
              </div>
            ) : (
              notes.map((note) => (
                <div 
                  key={note.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-white"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-xs">
                        {note.author.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-900">{note.title}</h3>
                          <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {note.author}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(note.created_at), 'MMM dd, yyyy')}
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

      <AddNoteDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddNote}
      />
    </div>
  );
};
