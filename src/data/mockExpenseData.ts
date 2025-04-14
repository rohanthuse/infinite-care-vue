
import { Expense } from "@/types/expense";
import { v4 as uuidv4 } from 'uuid';

export const mockExpenses: Expense[] = [
  {
    id: uuidv4(),
    description: "Office supplies - Paper, pens, and folders",
    amount: 125.75,
    date: "2024-04-08",
    category: "office_supplies",
    paymentMethod: "credit_card",
    receipt: "receipt-001.jpg",
    notes: "Monthly office supplies restocking",
    status: "approved",
    createdBy: "Jane Smith"
  },
  {
    id: uuidv4(),
    description: "Staff training workshop materials",
    amount: 350.00,
    date: "2024-04-05",
    category: "training",
    paymentMethod: "bank_transfer",
    receipt: "receipt-002.jpg",
    status: "approved",
    createdBy: "John Doe"
  },
  {
    id: uuidv4(),
    description: "Medical gloves and sanitizers",
    amount: 890.50,
    date: "2024-04-02",
    category: "medical_supplies",
    paymentMethod: "credit_card",
    receipt: "receipt-003.jpg",
    notes: "Urgent order due to low stock",
    status: "reimbursed",
    createdBy: "Jane Smith"
  },
  {
    id: uuidv4(),
    description: "Team lunch meeting",
    amount: 215.30,
    date: "2024-03-28",
    category: "meals",
    paymentMethod: "credit_card",
    status: "pending",
    createdBy: "Michael Brown"
  },
  {
    id: uuidv4(),
    description: "Software subscription - Scheduling system",
    amount: 499.99,
    date: "2024-03-25",
    category: "software",
    paymentMethod: "bank_transfer",
    receipt: "receipt-005.pdf",
    status: "approved",
    createdBy: "Jane Smith"
  },
  {
    id: uuidv4(),
    description: "Transportation to client site",
    amount: 78.50,
    date: "2024-03-20",
    category: "travel",
    paymentMethod: "cash",
    notes: "Taxi fare for urgent client visit",
    status: "reimbursed",
    createdBy: "Sarah Johnson"
  },
  {
    id: uuidv4(),
    description: "New computer monitor for reception",
    amount: 299.99,
    date: "2024-03-15",
    category: "equipment",
    paymentMethod: "credit_card",
    receipt: "receipt-007.jpg",
    status: "approved",
    createdBy: "John Doe"
  },
  {
    id: uuidv4(),
    description: "Utility bills - Electricity",
    amount: 523.45,
    date: "2024-03-10",
    category: "utilities",
    paymentMethod: "bank_transfer",
    receipt: "receipt-008.pdf",
    status: "approved",
    createdBy: "Jane Smith"
  },
  {
    id: uuidv4(),
    description: "Office rent - March",
    amount: 3500.00,
    date: "2024-03-01",
    category: "rent",
    paymentMethod: "bank_transfer",
    receipt: "receipt-009.pdf",
    status: "approved",
    createdBy: "Jane Smith"
  },
  {
    id: uuidv4(),
    description: "First aid kits replacement",
    amount: 445.75,
    date: "2024-02-28",
    category: "medical_supplies",
    paymentMethod: "credit_card",
    receipt: "receipt-010.jpg",
    status: "rejected",
    notes: "Expense rejected due to duplicate order",
    createdBy: "Michael Brown"
  }
];
