import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { formatSafeDate } from '@/lib/dateUtils';

interface Task {
  id: string;
  task_category: string;
  task_name: string;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
  priority?: string;
}

interface TasksTableProps {
  tasks: Task[];
}

export function TasksTable({ tasks }: TasksTableProps) {
  const completedTasks = tasks.filter(t => t.is_completed);
  const completionPercentage = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Completion Summary */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium">
            {completedTasks.length} of {tasks.length} tasks completed
          </span>
        </div>
        <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
          {completionPercentage}%
        </Badge>
      </div>

      {/* Tasks Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Task Name</TableHead>
            <TableHead>Completed At</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                {task.is_completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{task.task_category}</Badge>
              </TableCell>
              <TableCell className="font-medium">{task.task_name}</TableCell>
              <TableCell>
                {task.completed_at ? (
                  <span className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatSafeDate(task.completed_at, 'p')}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">Not completed</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {task.notes || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
