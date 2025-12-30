
import React, { useState } from "react";
import { format } from "date-fns";
import { MessageCircle, Clock, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AddNoteDialog } from "../dialogs/AddNoteDialog";
import { EditNoteDialog } from "../dialogs/EditNoteDialog";
import { DeleteNoteDialog } from "../dialogs/DeleteNoteDialog";
import { useClientNotes, useCreateClientNote, useUpdateClientNote, useDeleteClientNote, ClientNote } from "@/hooks/useClientNotes";

interface NotesTabProps {
  clientId: string;
  clientName?: string;
  notes?: any[];
}

export const NotesTab: React.FC<NotesTabProps> = ({ clientId, clientName }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClientNote | null>(null);
  
  const { data: notes = [], isLoading } = useClientNotes(clientId);
  const createNoteMutation = useCreateClientNote();
  const updateNoteMutation = useUpdateClientNote();
  const deleteNoteMutation = useDeleteClientNote();

  // For now, assuming all users are super admins - this should be replaced with proper role checking
  const canManageNotes = true;

  const handleDeleteDialogChange = React.useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      // Small delay to allow dialog close animation
      setTimeout(() => setSelectedNote(null), 150);
    }
  }, []);

  const handleAddNote = async (noteData: { title: string; content: string }) => {
    await createNoteMutation.mutateAsync({
      client_id: clientId,
      title: noteData.title,
      content: noteData.content,
      author: "Current User", // This should be replaced with actual user info
    });
  };

  const handleEditNote = (note: ClientNote) => {
    setSelectedNote(note);
    setIsEditDialogOpen(true);
  };

  const handleUpdateNote = async (noteData: { id: string; title: string; content: string }) => {
    await updateNoteMutation.mutateAsync({
      id: noteData.id,
      title: noteData.title,
      content: noteData.content,
    });
    setSelectedNote(null);
  };

  const handleDeleteNote = React.useCallback((note: ClientNote) => {
    setSelectedNote(note);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = React.useCallback(async () => {
    if (selectedNote) {
      await deleteNoteMutation.mutateAsync(selectedNote.id);
      setIsDeleteDialogOpen(false);
      setSelectedNote(null);
    }
  }, [selectedNote, deleteNoteMutation]);

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
          <CardDescription>Clinical observations and updates{clientName ? ` for ${clientName}` : ''}</CardDescription>
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
                  className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-white group"
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(note.created_at), 'MMM dd, yyyy')}
                          </span>
                          {canManageNotes && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNote(note)}
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNote(note)}
                                className="h-8 w-8 p-0 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          )}
                        </div>
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

      <EditNoteDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateNote}
        note={selectedNote}
      />

      <DeleteNoteDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onConfirm={handleConfirmDelete}
        note={selectedNote}
      />
    </div>
  );
};
