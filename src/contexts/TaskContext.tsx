
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

// Initial task data
const defaultTasks = [
  {
    id: "1",
    title: "Medication reminder for Emma Thompson",
    description: "Remind to take morning medication and record in log",
    dueDate: "Today, 10:30 AM",
    priority: "High",
    completed: false,
    client: "Emma Thompson",
    category: "Medication"
  },
  {
    id: "2",
    title: "Update care notes for James Wilson",
    description: "Complete daily care notes including mobility assessment",
    dueDate: "Today, 2:30 PM",
    priority: "Medium",
    completed: false,
    client: "James Wilson",
    category: "Documentation"
  },
  {
    id: "3",
    title: "Submit weekly report",
    description: "Complete and submit your weekly activity report",
    dueDate: "Tomorrow, 5:00 PM",
    priority: "Medium",
    completed: false,
    client: null,
    category: "Admin"
  },
  {
    id: "4",
    title: "Complete training module",
    description: "Finish the medication administration refresher course",
    dueDate: "Friday, 12:00 PM",
    priority: "Low",
    completed: false,
    client: null,
    category: "Training"
  },
  {
    id: "5",
    title: "Check vital signs for Margaret Brown",
    description: "Record blood pressure, temperature and heart rate",
    dueDate: "Today, 4:30 PM",
    priority: "High",
    completed: false,
    client: "Margaret Brown",
    category: "Health Check"
  },
  {
    id: "6",
    title: "Grocery shopping for Robert Johnson",
    description: "Purchase items from the shopping list provided",
    dueDate: "Tomorrow, 11:00 AM",
    priority: "Medium",
    completed: false,
    client: "Robert Johnson",
    category: "Errands"
  },
  {
    id: "7",
    title: "Review medication chart",
    description: "Check and update medication administration records",
    dueDate: "Yesterday, 3:00 PM",
    priority: "High",
    completed: true,
    client: "Emma Thompson",
    category: "Medication"
  },
  {
    id: "8",
    title: "Submit expense report",
    description: "Submit travel and expense claims for last week",
    dueDate: "Yesterday, 5:00 PM",
    priority: "Low",
    completed: true,
    client: null,
    category: "Admin"
  }
];

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: string;
  completed: boolean;
  client: string | null;
  category: string;
  assignee?: string | null;
  assigneeAvatar?: string | null;
  createdAt: string;
  tags?: string[];
};

interface TaskContextType {
  tasks: Task[];
  completeTask: (taskId: string) => void;
  updateTask: (task: Task) => void;
  addTask: (task: Task) => void;
  getTaskById: (taskId: string) => Task | undefined;
  deleteTask: (taskId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const { toast } = useToast();

  // Load tasks from localStorage on initial render
  useEffect(() => {
    const savedTasks = localStorage.getItem('carerTasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Error parsing tasks from localStorage:', e);
        // Fallback to default tasks if there's an error
        setTasks(defaultTasks);
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('carerTasks', JSON.stringify(tasks));
  }, [tasks]);

  const completeTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: true } 
          : task
      )
    );
    
    toast({
      title: "Task completed",
      description: "The task has been marked as complete.",
    });
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === updatedTask.id 
          ? updatedTask 
          : task
      )
    );
    
    toast({
      title: "Task updated",
      description: "Your changes have been saved.",
    });
  };

  const addTask = (newTask: Task) => {
    const taskWithId = {
      ...newTask,
      id: newTask.id || uuidv4()
    };
    
    setTasks(prev => [...prev, taskWithId]);
    
    toast({
      title: "Task added",
      description: "A new task has been added to your list.",
    });
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    
    toast({
      title: "Task deleted",
      description: "The task has been removed.",
    });
  };

  const getTaskById = (taskId: string) => {
    return tasks.find(task => task.id === taskId);
  };

  return (
    <TaskContext.Provider value={{ tasks, completeTask, updateTask, addTask, getTaskById, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  
  return context;
};
