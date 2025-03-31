
import { Task, TaskColumn, TaskStatus, TaskView } from "@/types/task";

// Sample tasks data
export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Complete client assessment",
    description: "Conduct initial assessment for new client John Doe",
    status: "todo",
    priority: "high",
    assignee: "Sarah Johnson",
    assigneeAvatar: "/avatars/sarah.jpg",
    dueDate: "2025-04-15",
    createdAt: "2025-04-01",
    tags: ["assessment", "new-client"],
    clientId: "client-1",
    clientName: "John Doe"
  },
  {
    id: "task-2",
    title: "Schedule follow-up appointment",
    description: "Book a follow-up session with Emma Wilson for treatment review",
    status: "todo",
    priority: "medium",
    assignee: "Michael Brown",
    assigneeAvatar: "/avatars/michael.jpg",
    dueDate: "2025-04-10",
    createdAt: "2025-04-02",
    tags: ["follow-up", "appointment"],
    clientId: "client-2",
    clientName: "Emma Wilson"
  },
  {
    id: "task-3",
    title: "Review medication plan",
    description: "Check and update medication plan for Robert Smith",
    status: "in-progress",
    priority: "high",
    assignee: "Dr. Lisa Adams",
    assigneeAvatar: "/avatars/lisa.jpg",
    dueDate: "2025-04-05",
    createdAt: "2025-04-02",
    tags: ["medication", "review"],
    clientId: "client-3",
    clientName: "Robert Smith"
  },
  {
    id: "task-4",
    title: "Update patient records",
    description: "Enter latest test results and notes into patient management system",
    status: "in-progress",
    priority: "medium",
    assignee: "James Wilson",
    assigneeAvatar: "/avatars/james.jpg",
    dueDate: "2025-04-07",
    createdAt: "2025-04-03",
    tags: ["admin", "records"],
    staffId: "staff-1",
    staffName: "James Wilson"
  },
  {
    id: "task-5",
    title: "Staff training session",
    description: "Conduct training on new care protocols for junior staff members",
    status: "todo",
    priority: "low",
    assignee: "Emily Parker",
    assigneeAvatar: "/avatars/emily.jpg",
    dueDate: "2025-04-20",
    createdAt: "2025-04-01",
    tags: ["training", "staff-development"],
    staffId: "staff-2",
    staffName: "Emily Parker"
  },
  {
    id: "task-6",
    title: "Equipment maintenance",
    description: "Schedule routine maintenance for medical equipment",
    status: "backlog",
    priority: "low",
    assignee: "Thomas Green",
    assigneeAvatar: "/avatars/thomas.jpg",
    dueDate: "2025-04-25",
    createdAt: "2025-03-28",
    tags: ["maintenance", "equipment"],
    staffId: "staff-3",
    staffName: "Thomas Green"
  },
  {
    id: "task-7",
    title: "Client consultation call",
    description: "Call with Jane Doe to discuss treatment options",
    status: "review",
    priority: "high",
    assignee: "Dr. Mark Johnson",
    assigneeAvatar: "/avatars/mark.jpg",
    dueDate: "2025-04-06",
    createdAt: "2025-04-03",
    tags: ["consultation", "call"],
    clientId: "client-4",
    clientName: "Jane Doe"
  },
  {
    id: "task-8",
    title: "Prepare care plan",
    description: "Develop comprehensive care plan for new patient",
    status: "done",
    priority: "high",
    assignee: "Dr. Patricia Lee",
    assigneeAvatar: "/avatars/patricia.jpg",
    dueDate: "2025-04-02",
    createdAt: "2025-03-30",
    tags: ["care-plan", "new-patient"],
    clientId: "client-5",
    clientName: "David Williams"
  },
  {
    id: "task-9",
    title: "Process referral",
    description: "Handle incoming referral from Cambridge General Hospital",
    status: "done",
    priority: "medium",
    assignee: "Amanda White",
    assigneeAvatar: "/avatars/amanda.jpg",
    dueDate: "2025-04-01",
    createdAt: "2025-03-29",
    tags: ["referral", "admin"],
    staffId: "staff-4",
    staffName: "Amanda White"
  }
];

// Filter tasks based on the selected view (staff or client)
export const filterTasksByView = (tasks: Task[], view: TaskView): Task[] => {
  if (view === "staff") {
    return tasks.filter(task => task.staffId || !task.clientId);
  } else {
    return tasks.filter(task => task.clientId);
  }
};

// Get task columns with their respective tasks
export const getTaskColumns = (): TaskColumn[] => {
  return [
    {
      id: "backlog",
      title: "Backlog",
      tasks: mockTasks.filter(task => task.status === "backlog"),
      color: "bg-gray-100"
    },
    {
      id: "todo",
      title: "To Do",
      tasks: mockTasks.filter(task => task.status === "todo"),
      color: "bg-blue-100"
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: mockTasks.filter(task => task.status === "in-progress"),
      color: "bg-amber-100"
    },
    {
      id: "review",
      title: "Review",
      tasks: mockTasks.filter(task => task.status === "review"),
      color: "bg-purple-100"
    },
    {
      id: "done",
      title: "Done",
      tasks: mockTasks.filter(task => task.status === "done"),
      color: "bg-green-100"
    }
  ];
};
