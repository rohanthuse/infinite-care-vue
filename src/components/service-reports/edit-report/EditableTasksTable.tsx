import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { CheckCircle, Circle } from 'lucide-react';

interface Task {
  id: string;
  task_category: string;
  task_name: string;
  is_completed: boolean;
  completed_at?: string;
  completion_notes?: string;
  notes?: string;
  priority?: string;
}

interface TaskChange {
  is_completed: boolean;
  completion_notes: string;
}

interface EditableTasksTableProps {
  tasks: Task[];
  onTasksChange: (changes: Map<string, TaskChange>) => void;
}

export function EditableTasksTable({ tasks, onTasksChange }: EditableTasksTableProps) {
  const [taskChanges, setTaskChanges] = useState<Map<string, TaskChange>>(new Map());

  // Initialize with current task values
  useEffect(() => {
    const initialChanges = new Map<string, TaskChange>();
    tasks.forEach(task => {
      initialChanges.set(task.id, {
        is_completed: task.is_completed,
        completion_notes: task.completion_notes || task.notes || '',
      });
    });
    setTaskChanges(initialChanges);
  }, [tasks]);

  const handleCompletionToggle = (taskId: string, isCompleted: boolean) => {
    const newChanges = new Map(taskChanges);
    const current = newChanges.get(taskId) || { is_completed: false, completion_notes: '' };
    newChanges.set(taskId, { ...current, is_completed: isCompleted });
    setTaskChanges(newChanges);
    onTasksChange(newChanges);
  };

  const handleNotesChange = (taskId: string, notes: string) => {
    const newChanges = new Map(taskChanges);
    const current = newChanges.get(taskId) || { is_completed: false, completion_notes: '' };
    newChanges.set(taskId, { ...current, completion_notes: notes });
    setTaskChanges(newChanges);
    onTasksChange(newChanges);
  };

  const completedCount = Array.from(taskChanges.values()).filter(c => c.is_completed).length;
  const completionPercentage = tasks.length > 0 
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Completion Summary */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium">
            {completedCount} of {tasks.length} tasks completed
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
            <TableHead className="w-[300px]">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const change = taskChanges.get(task.id);
            const isCompleted = change?.is_completed ?? task.is_completed;
            const notes = change?.completion_notes ?? task.completion_notes ?? task.notes ?? '';

            return (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => handleCompletionToggle(task.id, !!checked)}
                    className="h-5 w-5"
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{task.task_category}</Badge>
                </TableCell>
                <TableCell className="font-medium">{task.task_name}</TableCell>
                <TableCell>
                  <Input
                    value={notes}
                    onChange={(e) => handleNotesChange(task.id, e.target.value)}
                    placeholder="Add notes..."
                    className="h-8 text-sm"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
