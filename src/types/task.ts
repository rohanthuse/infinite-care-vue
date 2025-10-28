
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
  // Additional fields from database
  category?: string;
  notes?: string;
  completion_percentage?: number;
  branch_id?: string;
  assignee_id?: string;
  client_id?: string;
  created_by?: string;
  // Client visibility fields
  client_visible?: boolean;
  client_can_complete?: boolean;
  // Multiple assignees support
  assignees?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    specialization?: string;
  }>;
}

export interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
}
