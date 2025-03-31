
export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskView = 'staff' | 'client';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  createdAt: string;
  tags: string[];
  clientId?: string;
  clientName?: string;
  staffId?: string;
  staffName?: string;
}

export interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
}
