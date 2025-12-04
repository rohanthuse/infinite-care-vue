import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, CheckCircle, AlertCircle, Plus, Edit, Trash2, TrendingDown, Minus } from "lucide-react";
import { useStaffQuality } from "@/hooks/useStaffQuality";
import { useStaffImprovementAreas } from "@/hooks/useStaffImprovementAreas";
import { AddImprovementAreaDialog } from "./AddImprovementAreaDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CarerQualityAssuranceTabProps {
  carerId: string;
}

export const CarerQualityAssuranceTab: React.FC<CarerQualityAssuranceTabProps> = ({ carerId }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any | null>(null);
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);
  
  const { data: qualityData, isLoading } = useStaffQuality(carerId);
  const {
    improvementAreas,
    createImprovementArea,
    updateImprovementArea,
    deleteImprovementArea,
    isCreating,
    isUpdating,
    isDeleting,
  } = useStaffImprovementAreas(carerId);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading quality metrics...</p>
      </div>
    );
  }
  
  if (!qualityData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No quality data available</p>
      </div>
    );
  }
  
  const getTrendIcon = () => {
    switch (qualityData.performanceTrend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-orange-600" />;
      case 'needs_attention':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-blue-600" />;
    }
  };
  
  const getTrendBadge = () => {
    switch (qualityData.performanceTrend) {
      case 'improving':
        return <Badge variant="custom" className="bg-green-100 text-green-800">Improving</Badge>;
      case 'stable':
        return <Badge variant="custom" className="bg-blue-100 text-blue-800">Stable</Badge>;
      case 'declining':
        return <Badge variant="custom" className="bg-orange-100 text-orange-800">Declining</Badge>;
      case 'needs_attention':
        return <Badge variant="custom" className="bg-red-100 text-red-800">Needs Attention</Badge>;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Quality Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Quality Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {qualityData.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
              <div className="flex justify-center mt-1">
                {[1,2,3,4,5].map(star => (
                  <Star 
                    key={star} 
                    className={`h-3 w-3 ${
                      star <= Math.round(qualityData.averageRating) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Based on {qualityData.totalReviews} reviews
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {qualityData.taskCompletionRate.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Task Completion</div>
              <div className="text-xs text-muted-foreground mt-1">
                {qualityData.completedBookings} of {qualityData.totalBookings} bookings
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {qualityData.punctualityScore.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Punctuality</div>
              <div className="text-xs text-muted-foreground mt-1">
                {qualityData.lateArrivals} late arrivals
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Client Satisfaction</span>
                <span>{qualityData.clientSatisfactionScore.toFixed(1)}/5.0</span>
              </div>
              <Progress value={(qualityData.clientSatisfactionScore / 5) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Documentation Quality</span>
                <span>{qualityData.documentationQualityScore.toFixed(1)}/5.0</span>
              </div>
              <Progress value={(qualityData.documentationQualityScore / 5) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Communication Skills</span>
                <span>{qualityData.communicationSkillsScore.toFixed(1)}/5.0</span>
              </div>
              <Progress value={(qualityData.communicationSkillsScore / 5) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTrendIcon()}
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                {getTrendIcon()}
                <div>
                  <p className="font-medium">Current Trend</p>
                  <p className="text-sm text-muted-foreground">{qualityData.trendDetails}</p>
                </div>
              </div>
              {getTrendBadge()}
            </div>
            
            {qualityData.incidentsReported > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Incidents Tracking</p>
                    <p className="text-sm text-muted-foreground">
                      {qualityData.incidentsResolved} of {qualityData.incidentsReported} incidents resolved
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-100 text-amber-800">
                  {((qualityData.incidentsResolved / qualityData.incidentsReported) * 100).toFixed(0)}% resolved
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Areas for Improvement Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Areas for Improvement ({qualityData.improvementAreas.length})
          </CardTitle>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Area
          </Button>
        </CardHeader>
        <CardContent>
          {qualityData.improvementAreas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
              <p className="font-medium">No improvement areas identified</p>
              <p className="text-sm">Keep up the excellent work!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {qualityData.improvementAreas.map((area) => (
                <Card key={area.id} className={`p-4 border-l-4 ${getSeverityColor(area.severity)}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{area.area_title}</h4>
                        <Badge variant="outline" className={getSeverityColor(area.severity)}>
                          {area.severity}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {area.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{area.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingArea(area)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeletingAreaId(area.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {area.action_plan && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium mb-1">Action Plan:</p>
                      <p className="text-muted-foreground">{area.action_plan}</p>
                    </div>
                  )}
                  
                  {area.progress_percentage > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{area.progress_percentage}%</span>
                      </div>
                      <Progress value={area.progress_percentage} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span>Status: <strong>{area.status.replace('_', ' ')}</strong></span>
                    {area.target_completion_date && (
                      <span>Target: {new Date(area.target_completion_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <AddImprovementAreaDialog
        open={isAddDialogOpen || !!editingArea}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingArea(null);
          }
        }}
        onSubmit={(data) => {
          if (editingArea) {
            updateImprovementArea({ id: editingArea.id, ...data }, {
              onSuccess: () => setEditingArea(null),
            });
          } else {
            createImprovementArea(data, {
              onSuccess: () => setIsAddDialogOpen(false),
            });
          }
        }}
        isLoading={isCreating || isUpdating}
        staffId={carerId}
        editArea={editingArea}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAreaId} onOpenChange={(open) => !open && setDeletingAreaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Improvement Area?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this improvement area? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingAreaId) {
                  deleteImprovementArea(deletingAreaId, {
                    onSuccess: () => setDeletingAreaId(null),
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};