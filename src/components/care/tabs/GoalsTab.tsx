
import React from "react";
import { Activity, BarChart2, Trophy, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass, calculateProgressPercentage } from "@/utils/statusHelpers";

interface GoalType {
  title: string;
  status: string;
  target: string;
  notes: string;
}

interface GoalsTabProps {
  goals: GoalType[];
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ goals }) => {
  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <span>Care Goals</span>
        </CardTitle>
        <CardDescription>Tracking progress toward objectives</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {goals.map((goal, index) => {
            const progressPercentage = calculateProgressPercentage(goal.status, goal.notes);
            
            return (
              <div key={index} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {goal.status === "Active" && (
                        <div className="mr-3 p-2 rounded-full bg-blue-100">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      {goal.status === "In Progress" && (
                        <div className="mr-3 p-2 rounded-full bg-amber-100">
                          <BarChart2 className="h-5 w-5 text-amber-600" />
                        </div>
                      )}
                      {goal.status === "Completed" && (
                        <div className="mr-3 p-2 rounded-full bg-green-100">
                          <Trophy className="h-5 w-5 text-green-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-lg">{goal.title}</h3>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className={getStatusBadgeClass(goal.status)}>
                            {goal.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-700">Target</p>
                      <p className="text-sm text-gray-500">{progressPercentage}% Complete</p>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          goal.status === "Completed" ? "bg-green-600" : 
                          goal.status === "In Progress" ? "bg-amber-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    
                    <p className="mt-2 text-sm font-medium flex items-center">
                      <BadgeCheck className="h-4 w-4 mr-1.5 text-blue-600" />
                      {goal.target}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                    <p className="text-sm bg-gray-50 p-2 rounded-md border border-gray-100">
                      {goal.notes}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
