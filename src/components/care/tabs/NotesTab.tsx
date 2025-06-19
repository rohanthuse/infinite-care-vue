
import React from "react";
import { format } from "date-fns";
import { MessageCircle, Clock, User, ChevronRight, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClientNotes } from "@/hooks/useClientNotes";

interface Note {
  date: Date;
  author: string;
  content: string;
}

interface NotesTabProps {
  notes?: Note[];
  onAddNote?: () => void;
  clientId?: string;
}

// Helper function to extract role from author field
const extractRoleFromAuthor = (author: string): string => {
  // If author contains "Admin", "Carer", or other role indicators, extract them
  if (author === "Admin") return "Admin";
  if (author === "Carer") return "Carer";
  if (author.includes("Admin")) return "Admin";
  if (author.includes("Carer")) return "Carer";
  
  // Default fallback is Admin since they are the primary administrative role
  return "Admin";
};

export const NotesTab: React.FC<NotesTabProps> = ({ notes: propNotes, onAddNote, clientId }) => {
  console.log('[NotesTab] Rendering with clientId:', clientId);
  
  // Use database notes if clientId is provided, otherwise fall back to prop notes
  const { 
    data: dbNotes = [], 
    isLoading, 
    error,
    isError 
  } = useClientNotes(clientId || '', {
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
  
  console.log('[NotesTab] Hook state:', { 
    dbNotesCount: dbNotes.length, 
    isLoading, 
    error, 
    isError,
    clientId 
  });

  // Transform database notes to match expected format
  const transformedDbNotes = dbNotes.map(note => ({
    date: new Date(note.created_at),
    author: note.author,
    content: note.content
  }));

  // Use database notes if available and clientId exists, otherwise use prop notes
  const notesToDisplay = clientId && transformedDbNotes.length > 0 ? transformedDbNotes : (propNotes || []);

  console.log('[NotesTab] Notes to display:', notesToDisplay.length);

  if (isLoading && clientId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading notes...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError && error) {
    console.error('[NotesTab] Error loading notes:', error);
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load notes. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
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
            {notesToDisplay.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No notes available</p>
                {onAddNote && (
                  <Button variant="outline" className="mt-3" onClick={onAddNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Note
                  </Button>
                )}
              </div>
            ) : (
              notesToDisplay.map((note, index) => (
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
