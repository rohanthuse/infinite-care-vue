import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Plus, X, ClipboardList } from 'lucide-react';

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

interface NewTask {
  task_category: string;
  task_name: string;
  is_completed: boolean;
  completion_notes: string;
}

interface EditableTasksTableProps {
  tasks: Task[];
  onTasksChange: (changes: Map<string, TaskChange>) => void;
  onAddTask?: (task: NewTask) => void;
  allowManualAdd?: boolean;
}

const taskCategories = [
  'Personal Care',
  'Medication',
  'Mobility',
  'Nutrition',
  'Housekeeping',
  'Social',
  'Health Monitoring',
  'Communication',
  'Safety',
  'Other',
];

export function EditableTasksTable({ tasks, onTasksChange, onAddTask, allowManualAdd = true }: EditableTasksTableProps) {
  const [taskChanges, setTaskChanges] = useState<Map<string, TaskChange>>(new Map());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState<NewTask>({
    task_category: '',
    task_name: '',
    is_completed: false,
    completion_notes: '',
  });
  const [manualTasks, setManualTasks] = useState<(NewTask & { tempId: string })[]>([]);

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

  const handleAddTask = () => {
    if (!newTask.task_category || !newTask.task_name) return;
    
    const tempId = `manual-${Date.now()}`;
    const taskToAdd = { ...newTask, tempId };
    setManualTasks([...manualTasks, taskToAdd]);
    
    // Also add to changes map
    const newChanges = new Map(taskChanges);
    newChanges.set(tempId, {
      is_completed: newTask.is_completed,
      completion_notes: newTask.completion_notes,
    });
    setTaskChanges(newChanges);
    onTasksChange(newChanges);
    
    if (onAddTask) {
      onAddTask(newTask);
    }
    
    // Reset form
    setNewTask({
      task_category: '',
      task_name: '',
      is_completed: false,
      completion_notes: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveManualTask = (tempId: string) => {
    setManualTasks(manualTasks.filter(t => t.tempId !== tempId));
    const newChanges = new Map(taskChanges);
    newChanges.delete(tempId);
    setTaskChanges(newChanges);
    onTasksChange(newChanges);
  };

  const handleManualTaskToggle = (tempId: string, isCompleted: boolean) => {
    setManualTasks(manualTasks.map(t => 
      t.tempId === tempId ? { ...t, is_completed: isCompleted } : t
    ));
    const newChanges = new Map(taskChanges);
    const current = newChanges.get(tempId) || { is_completed: false, completion_notes: '' };
    newChanges.set(tempId, { ...current, is_completed: isCompleted });
    setTaskChanges(newChanges);
    onTasksChange(newChanges);
  };

  const handleManualTaskNotesChange = (tempId: string, notes: string) => {
    setManualTasks(manualTasks.map(t => 
      t.tempId === tempId ? { ...t, completion_notes: notes } : t
    ));
    const newChanges = new Map(taskChanges);
    const current = newChanges.get(tempId) || { is_completed: false, completion_notes: '' };
    newChanges.set(tempId, { ...current, completion_notes: notes });
    setTaskChanges(newChanges);
    onTasksChange(newChanges);
  };

  const allTasks = [...tasks, ...manualTasks.map(t => ({
    id: t.tempId,
    task_category: t.task_category,
    task_name: t.task_name,
    is_completed: t.is_completed,
    completion_notes: t.completion_notes,
    isManual: true,
  }))];

  const completedCount = Array.from(taskChanges.values()).filter(c => c.is_completed).length;
  const completionPercentage = allTasks.length > 0 
    ? Math.round((completedCount / allTasks.length) * 100)
    : 0;

  if (allTasks.length === 0 && !showAddForm) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm mb-4">No tasks recorded for this visit</p>
        {allowManualAdd && (
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Task Button */}
      {allowManualAdd && !showAddForm && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      )}

      {/* Add Task Form */}
      {showAddForm && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Add New Task</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={newTask.task_category}
              onValueChange={(value) => setNewTask({ ...newTask, task_category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {taskCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newTask.task_name}
              onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
              placeholder="Task name"
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={newTask.is_completed}
              onCheckedChange={(checked) => setNewTask({ ...newTask, is_completed: !!checked })}
            />
            <span className="text-sm">Mark as completed</span>
          </div>
          <Input
            value={newTask.completion_notes}
            onChange={(e) => setNewTask({ ...newTask, completion_notes: e.target.value })}
            placeholder="Notes (optional)"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddTask} disabled={!newTask.task_category || !newTask.task_name}>
              Add Task
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Completion Summary */}
      {allTasks.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">
              {completedCount} of {allTasks.length} tasks completed
            </span>
          </div>
          <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
            {completionPercentage}%
          </Badge>
        </div>
      )}

      {/* Tasks Table */}
      {allTasks.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead className="w-[300px]">Notes</TableHead>
              <TableHead className="w-12"></TableHead>
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
                  <TableCell></TableCell>
                </TableRow>
              );
            })}
            {manualTasks.map((task) => (
              <TableRow key={task.tempId} className="bg-primary/5">
                <TableCell>
                  <Checkbox
                    checked={task.is_completed}
                    onCheckedChange={(checked) => handleManualTaskToggle(task.tempId, !!checked)}
                    className="h-5 w-5"
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{task.task_category}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {task.task_name}
                  <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                </TableCell>
                <TableCell>
                  <Input
                    value={task.completion_notes}
                    onChange={(e) => handleManualTaskNotesChange(task.tempId, e.target.value)}
                    placeholder="Add notes..."
                    className="h-8 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveManualTask(task.tempId)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
