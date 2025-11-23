import React from 'react';
import { useClientTasks } from '@/hooks/useClientTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';

const ClientTasks: React.FC = () => {
  const { tasks, isLoading, error, completeTask, isCompleting, clientId, isAuthenticated } = useClientTasks();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'backlog': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'done': return 'Done';
      case 'review': return 'Review';
      case 'backlog': return 'Backlog';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">
            Tasks assigned to you by your care team
          </p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Circle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Unable to load tasks</h3>
            <div className="text-red-600 text-center space-y-2 max-w-md">
              <p className="text-sm">{error.message}</p>
              <p className="text-xs mt-4 text-gray-500">
                Please try refreshing the page or contact your care team for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600 mt-1">
          Tasks assigned to you by your care team
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Circle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
            <div className="text-gray-600 text-center space-y-2 max-w-md">
              <p>Tasks will appear here when your care team:</p>
              <ul className="text-sm space-y-1">
                <li>• Assigns a task to you</li>
                <li>• Marks the task as "Visible to Client"</li>
              </ul>
              <p className="text-xs mt-4 text-gray-500">
                If you're expecting a task, please contact your care team to ensure it's shared with you.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {task.status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                      {task.title}
                    </CardTitle>
                    {task.description && (
                      <CardDescription className="text-sm">
                        {task.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={getPriorityColor(task.priority)}
                    >
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={getStatusColor(task.status)}
                    >
                      {formatStatus(task.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                  {(task.assignees && task.assignees.length > 0) || task.assignee_name ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        Assigned by: {
                          task.assignees && task.assignees.length > 0
                            ? task.assignees.length === 1
                              ? `${task.assignees[0].first_name} ${task.assignees[0].last_name}`
                              : `${task.assignees.map(a => `${a.first_name} ${a.last_name}`).join(', ')}`
                            : task.assignee_name
                        }
                      </span>
                    </div>
                  ) : null}
                  
                  {task.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Created: {format(new Date(task.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                {task.category && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Badge variant="secondary" className="text-xs">
                      {task.category}
                    </Badge>
                  </div>
                )}

                {task.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{task.notes}</p>
                  </div>
                )}

                {task.client_can_complete && task.status !== 'done' && (
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={() => completeTask(task.id)}
                      disabled={isCompleting}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    >
                      {isCompleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientTasks;