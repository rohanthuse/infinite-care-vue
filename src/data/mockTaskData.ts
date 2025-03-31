
import { Task, TaskColumn, TaskStatus } from "@/types/task";

// Helper function to generate random dates
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

// Generate mock tasks
export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Complete client assessment",
    description: "Perform initial assessment for new client John Smith",
    status: "todo",
    priority: "high",
    assignee: "Sarah Johnson",
    assigneeAvatar: "/placeholder.svg",
    dueDate: randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    createdAt: randomDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), new Date()),
    tags: ["assessment", "new-client"],
    clientId: "client-1",
    clientName: "John Smith"
  },
  {
    id: "task-2",
    title: "Medication review",
    description: "Review and update medication plan for Emma Thompson",
    status: "in-progress",
    priority: "urgent",
    assignee: "Dr. Michael Chen",
    assigneeAvatar: "/placeholder.svg",
    dueDate: randomDate(new Date(), new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
    createdAt: randomDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), new Date()),
    tags: ["medication", "review"],
    clientId: "client-2",
    clientName: "Emma Thompson"
  },
  {
    id: "task-3",
    title: "Equipment installation",
    description: "Install mobility aids in Robert Wilson's home",
    status: "done",
    priority: "medium",
    assignee: "Alex Turner",
    assigneeAvatar: "/placeholder.svg",
    dueDate: randomDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), new Date()),
    createdAt: randomDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), new Date()),
    tags: ["equipment", "installation"],
    clientId: "client-3",
    clientName: "Robert Wilson"
  },
  {
    id: "task-4",
    title: "Care plan update",
    description: "Update care plan based on recent assessment findings",
    status: "review",
    priority: "high",
    assignee: "Elizabeth Parker",
    assigneeAvatar: "/placeholder.svg",
    dueDate: randomDate(new Date(), new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
    createdAt: randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()),
    tags: ["care-plan", "update"],
    clientId: "client-4",
    clientName: "Patricia Davis"
  },
  {
    id: "task-5",
    title: "Staff training session",
    description: "Conduct training on new care protocols",
    status: "backlog",
    priority: "medium",
    assignee: "Training Department",
    assigneeAvatar: "/placeholder.svg",
    dueDate: randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    createdAt: randomDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), new Date()),
    tags: ["training", "staff"],
    staffId: "staff-dept",
    staffName: "Training Team"
  },
  {
    id: "task-6",
    title: "Medication delivery",
    description: "Arrange delivery of prescription medications",
    status: "todo",
    priority: "high",
    assignee: "Pharmacy Liaison",
    assigneeAvatar: "/placeholder.svg",
    dueDate: randomDate(new Date(), new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)),
    createdAt: randomDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), new Date()),
    tags: ["medication", "delivery"],
    clientId: "client-5",
    clientName: "James Brown"
  },
  {
    id: "task-7",
    title: "Follow-up call",
    description: "Schedule follow-up call with family members",
    status: "in-progress",
    priority: "low",
    assignee: "Client Relations",
    assigneeAvatar: "/placeholder.svg",
    dueDate: randomDate(new Date(), new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
    createdAt: randomDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), new Date()),
    tags: ["follow-up", "family"],
    clientId: "client-6",
    clientName: "Mary Johnson"
  },
  {
    id: "task-8",
    title: "Documentation review",
    description: "Review and approve care documentation",
    status: "review",
    priority: "medium",
    assignee: "Documentation Team",
    assigneeAvatar: "/placeholder.svg",
    dueDate: randomDate(new Date(), new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
    createdAt: randomDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), new Date()),
    tags: ["documentation", "review"],
    staffId: "staff-doc",
    staffName: "Documentation Team"
  },
  {
    id: "task-9",
    title: "Emergency protocol update",
    description: "Update emergency response protocols",
    status: "backlog",
    priority: "high",
    assignee: "Safety Officer",
    assigneeAvatar: "/placeholder.svg",
    dueDate: randomDate(new Date(), new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)),
    createdAt: randomDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), new Date()),
    tags: ["emergency", "protocol"],
    staffId: "staff-safety",
    staffName: "Safety Department"
  },
  {
    id: "task-10",
    title: "Client feedback collection",
    description: "Collect feedback from recent service users",
    status: "done",
    priority: "low",
    assignee: "Quality Assurance",
    assigneeAvatar: "/placeholder.svg",
    dueDate: randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()),
    createdAt: randomDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), new Date()),
    tags: ["feedback", "quality"],
    staffId: "staff-qa",
    staffName: "QA Team"
  }
];

// Generate the columns for the task board
export const getTaskColumns = (): TaskColumn[] => {
  const columns: TaskColumn[] = [
    {
      id: "backlog",
      title: "Backlog",
      tasks: mockTasks.filter(task => task.status === "backlog"),
      color: "bg-gray-200"
    },
    {
      id: "todo",
      title: "To Do",
      tasks: mockTasks.filter(task => task.status === "todo"),
      color: "bg-blue-200"
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: mockTasks.filter(task => task.status === "in-progress"),
      color: "bg-yellow-200"
    },
    {
      id: "review",
      title: "Review",
      tasks: mockTasks.filter(task => task.status === "review"),
      color: "bg-purple-200"
    },
    {
      id: "done",
      title: "Done",
      tasks: mockTasks.filter(task => task.status === "done"),
      color: "bg-green-200"
    }
  ];
  
  return columns;
};

// Filter tasks by view (staff or client)
export const filterTasksByView = (tasks: Task[], view: 'staff' | 'client'): Task[] => {
  if (view === 'staff') {
    return tasks.filter(task => task.staffId || (!task.clientId && !task.staffId));
  } else {
    return tasks.filter(task => task.clientId);
  }
};
