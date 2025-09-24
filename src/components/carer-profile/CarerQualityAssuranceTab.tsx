import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

interface CarerQualityAssuranceTabProps {
  carerId: string;
}

export const CarerQualityAssuranceTab: React.FC<CarerQualityAssuranceTabProps> = ({ carerId }) => {
  return (
    <div className="space-y-6">
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
              <div className="text-2xl font-bold text-blue-600">4.8</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
              <div className="flex justify-center mt-1">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className={`h-3 w-3 ${star <= 5 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-muted-foreground">Task Completion</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">95%</div>
              <div className="text-sm text-muted-foreground">Punctuality</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Client Satisfaction</span>
                <span>4.8/5.0</span>
              </div>
              <Progress value={96} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Documentation Quality</span>
                <span>4.6/5.0</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Communication Skills</span>
                <span>4.9/5.0</span>
              </div>
              <Progress value={98} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Excellent Performance</p>
                  <p className="text-sm text-muted-foreground">Consistently high ratings this quarter</p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Improving
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Client Feedback</p>
                  <p className="text-sm text-muted-foreground">Positive reviews from all assigned clients</p>
                </div>
              </div>
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                Stable
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No improvement areas identified</p>
            <p className="text-sm">Keep up the excellent work!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};