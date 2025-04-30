
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Check, AlertCircle, Clock } from "lucide-react";

interface VisitTasksProps {
  clientId: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  completed: boolean;
  notes: string;
}

export const VisitTasks: React.FC<VisitTasksProps> = ({ clientId }) => {
  // Mock tasks - in a real app these would be fetched based on clientId and care plan
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Personal Hygiene",
      description: "Assist with washing, oral care and getting dressed",
      category: "Personal Care",
      required: true,
      completed: false,
      notes: ""
    },
    {
      id: "2",
      title: "Medication Reminder",
      description: "Remind client to take morning medication",
      category: "Medication",
      required: true,
      completed: false,
      notes: ""
    },
    {
      id: "3",
      title: "Breakfast Preparation",
      description: "Prepare and serve breakfast",
      category: "Nutrition",
      required: true,
      completed: false,
      notes: ""
    },
    {
      id: "4",
      title: "Light Exercise",
      description: "Assist with prescribed mobility exercises",
      category: "Mobility",
      required: false,
      completed: false,
      notes: ""
    },
    {
      id: "5",
      title: "Tidy Living Space",
      description: "Light housekeeping in main living areas",
      category: "Environment",
      required: false,
      completed: false,
      notes: ""
    }
  ]);
  
  const handleTaskComplete = (taskId: string, completed: boolean) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed } : task
    ));
  };
  
  const handleTaskNotes = (taskId: string, notes: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, notes } : task
    ));
  };
  
  const completedRequiredTasks = tasks.filter(t => t.required && t.completed).length;
  const totalRequiredTasks = tasks.filter(t => t.required).length;
  const progress = (completedRequiredTasks / totalRequiredTasks) * 100;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <ClipboardList className="h-5 w-5 text-blue-600 mr-2" />
              <span>Required Tasks</span>
            </CardTitle>
            <Badge className={progress === 100 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
              {completedRequiredTasks}/{totalRequiredTasks} Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full ${progress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {tasks.filter(t => t.required).map((task) => (
            <div key={task.id} className="mb-4 p-4 border rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id={`task-${task.id}`} 
                    checked={task.completed}
                    onCheckedChange={(checked) => handleTaskComplete(task.id, checked === true)}
                    className="mt-1"
                  />
                  <div>
                    <Label 
                      htmlFor={`task-${task.id}`}
                      className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}
                    >
                      {task.title}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    <Badge variant="outline" className="mt-2">{task.category}</Badge>
                  </div>
                </div>
                <Badge variant={task.completed ? "success" : "outline"}>
                  {task.completed ? "Completed" : "Pending"}
                </Badge>
              </div>
              
              <div className="mt-4">
                <Label htmlFor={`notes-${task.id}`} className="text-sm">Notes</Label>
                <Textarea 
                  id={`notes-${task.id}`}
                  placeholder="Add notes about this task..."
                  value={task.notes}
                  onChange={(e) => handleTaskNotes(task.id, e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Optional Tasks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Optional Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.filter(t => !t.required).map((task) => (
            <div key={task.id} className="mb-4 p-4 border rounded-md bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id={`task-${task.id}`} 
                    checked={task.completed}
                    onCheckedChange={(checked) => handleTaskComplete(task.id, checked === true)}
                    className="mt-1"
                  />
                  <div>
                    <Label 
                      htmlFor={`task-${task.id}`}
                      className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}
                    >
                      {task.title}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    <Badge variant="outline" className="mt-2">{task.category}</Badge>
                  </div>
                </div>
                <Badge variant={task.completed ? "success" : "outline"}>
                  {task.completed ? "Completed" : "Optional"}
                </Badge>
              </div>
              
              {task.completed && (
                <div className="mt-4">
                  <Label htmlFor={`notes-${task.id}`} className="text-sm">Notes</Label>
                  <Textarea 
                    id={`notes-${task.id}`}
                    placeholder="Add notes about this task..."
                    value={task.notes}
                    onChange={(e) => handleTaskNotes(task.id, e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
