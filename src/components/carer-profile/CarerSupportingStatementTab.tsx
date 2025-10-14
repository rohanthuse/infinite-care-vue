import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, Save, X, Plus, Star, Loader2 } from "lucide-react";
import { useStaffStatement } from "@/hooks/useStaffStatement";
import { useStaffReferences } from "@/hooks/useStaffReferences";
import { useStaffCareerHighlights } from "@/hooks/useStaffCareerHighlights";

interface CarerSupportingStatementTabProps {
  carerId: string;
}

const getColorClasses = (color: string) => {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
  };
  return colorMap[color] || 'bg-blue-50';
};

const getDotColorClasses = (color: string) => {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return colorMap[color] || 'bg-blue-500';
};

export const CarerSupportingStatementTab: React.FC<CarerSupportingStatementTabProps> = ({ carerId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [statementText, setStatementText] = useState("");

  const { statement, isLoading: isLoadingStatement, updateStatement, isUpdating } = useStaffStatement(carerId);
  const { references, isLoading: isLoadingReferences } = useStaffReferences(carerId);
  const { highlights, isLoading: isLoadingHighlights } = useStaffCareerHighlights(carerId);

  // Initialize statement text when data loads
  React.useEffect(() => {
    if (statement?.statement) {
      setStatementText(statement.statement);
    }
  }, [statement]);

  const handleSaveStatement = () => {
    updateStatement(statementText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setStatementText(statement?.statement || "");
    setIsEditing(false);
  };

  if (isLoadingStatement || isLoadingReferences || isLoadingHighlights) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Personal Statement
          </CardTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSaveStatement} disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isUpdating}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={statementText}
              onChange={(e) => setStatementText(e.target.value)}
              rows={12}
              className="resize-none"
              placeholder="Write your personal statement here..."
              disabled={isUpdating}
            />
          ) : (
            <div className="prose max-w-none">
              {statementText ? (
                statementText.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No personal statement has been added yet. Click "Edit" to add one.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Professional References
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Reference
          </Button>
        </CardHeader>
        <CardContent>
          {references.length > 0 ? (
            <div className="space-y-4">
              {references.map((reference) => (
                <Card key={reference.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{reference.name}</h4>
                      <p className="text-sm text-muted-foreground">{reference.position}</p>
                      <p className="text-sm text-muted-foreground">{reference.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className={`h-3 w-3 ${star <= reference.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <Badge variant="outline">{reference.relationship}</Badge>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm italic">"{reference.statement}"</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                    <span>Reference obtained: {new Date(reference.contact_date).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No professional references have been added yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Career Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          {highlights.length > 0 ? (
            <div className="space-y-3">
              {highlights.map((highlight) => (
                <div key={highlight.id} className={`flex items-center gap-3 p-3 ${getColorClasses(highlight.color)} rounded-lg`}>
                  <div className={`h-2 w-2 ${getDotColorClasses(highlight.color)} rounded-full`} />
                  <div>
                    <p className="font-medium">{highlight.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {highlight.description} - {new Date(highlight.achieved_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No career highlights have been added yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};