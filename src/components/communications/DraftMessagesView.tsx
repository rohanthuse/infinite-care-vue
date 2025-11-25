import React from 'react';
import { useDraftMessages, useDeleteDraft } from '@/hooks/useMessageDraftsAndScheduled';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export const DraftMessagesView: React.FC = () => {
  const { data: drafts = [], isLoading } = useDraftMessages();
  const deleteDraft = useDeleteDraft();

  const handleDelete = async (draftId: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      await deleteDraft.mutateAsync(draftId);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading drafts...</div>;
  }

  if (drafts.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileText className="h-16 w-16 mx-auto text-muted mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Draft Messages</h3>
        <p className="text-muted-foreground">Messages you save as drafts will appear here.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Draft Messages ({drafts.length})</h2>
        {drafts.map((draft: any) => (
          <Card key={draft.id} className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base mb-2 text-foreground">
                    {draft.subject || 'No Subject'}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Last saved: {format(new Date(draft.updated_at), 'PPp')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(draft.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {draft.priority && draft.priority !== 'medium' && (
                    <Badge variant={draft.priority === 'high' ? 'destructive' : 'secondary'}>
                      {draft.priority}
                    </Badge>
                  )}
                  {draft.action_required && <Badge variant="destructive">Action Required</Badge>}
                  {draft.admin_eyes_only && <Badge>Admin Only</Badge>}
                  {draft.auto_saved && <Badge variant="outline">Auto-saved</Badge>}
                </div>
                <p className="text-sm text-foreground line-clamp-3">{draft.content}</p>
                <div className="text-xs text-muted-foreground">
                  Recipients: {draft.recipient_names?.join(', ') || 'None'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
