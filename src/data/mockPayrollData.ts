
import { PayrollRecord } from "@/types/payroll";
import { v4 as uuidv4 } from 'uuid';

export const mockPayrollData: PayrollRecord[] = [
  {
    id: uuidv4(),
    employeeId: "EMP001",
    employeeName: "Jane Smith",
    jobTitle: "Senior Care Assistant",
    payPeriod: {
      from: "2024-04-01",
      to: "2024-04-30"
    },
    regularHours: 160,
    overtimeHours: 12,
    basicSalary: 2400.00,
    overtimePay: 270.00,
    bonus: 100.00,
    deductions: {
      tax: 420.00,
      nationalInsurance: 180.00,
      pension: 120.00,
      other: 0.00
    },
    grossPay: 2770.00,
    netPay: 2050.00,
    paymentStatus: "processed",
    paymentMethod: "bank_transfer",
    paymentDate: "2024-04-30"
  },
  {
    id: uuidv4(),
    employeeId: "EMP002",
    employeeName: "John Doe",
    jobTitle: "Care Coordinator",
    payPeriod: {
      from: "2024-04-01",
      to: "2024-04-30"
    },
    regularHours: 160,
    overtimeHours: 0,
    basicSalary: 2800.00,
    overtimePay: 0.00,
    bonus: 150.00,
    deductions: {
      tax: 480.00,
      nationalInsurance: 210.00,
      pension: 140.00,
      other: 0.00
    },
    grossPay: 2950.00,
    netPay: 2120.00,
    paymentStatus: "processed",
    paymentMethod: "bank_transfer",
    paymentDate: "2024-04-30"
  },
  {
    id: uuidv4(),
    employeeId: "EMP003",
    employeeName: "Emma Wilson",
    jobTitle: "Care Assistant",
    payPeriod: {
      from: "2024-04-01",
      to: "2024-04-30"
    },
    regularHours: 120,
    overtimeHours: 8,
    basicSalary: 1800.00,
    overtimePay: 180.00,
    bonus: 0.00,
    deductions: {
      tax: 280.00,
      nationalInsurance: 140.00,
      pension: 90.00,
      other: 0.00
    },
    grossPay: 1980.00,
    netPay: 1470.00,
    paymentStatus: "pending",
    paymentMethod: "bank_transfer",
    paymentDate: "2024-05-01"
  },
  {
    id: uuidv4(),
    employeeId: "EMP004",
    employeeName: "Michael Brown",
    jobTitle: "Branch Manager",
    payPeriod: {
      from: "2024-04-01",
      to: "2024-04-30"
    },
    regularHours: 160,
    overtimeHours: 0,
    basicSalary: 3500.00,
    overtimePay: 0.00,
    bonus: 200.00,
    deductions: {
      tax: 680.00,
      nationalInsurance: 290.00,
      pension: 175.00,
      other: 0.00
    },
    grossPay: 3700.00,
    netPay: 2555.00,
    paymentStatus: "processed",
    paymentMethod: "bank_transfer",
    paymentDate: "2024-04-30"
  },
  {
    id: uuidv4(),
    employeeId: "EMP005",
    employeeName: "Sarah Johnson",
    jobTitle: "Care Assistant",
    payPeriod: {
      from: "2024-04-01",
      to: "2024-04-30"
    },
    regularHours: 80,
    overtimeHours: 0,
    basicSalary: 1200.00,
    overtimePay: 0.00,
    bonus: 0.00,
    deductions: {
      tax: 120.00,
      nationalInsurance: 80.00,
      pension: 60.00,
      other: 0.00
    },
    grossPay: 1200.00,
    netPay: 940.00,
    paymentStatus: "processed",
    paymentMethod: "bank_transfer",
    paymentDate: "2024-04-30"
  },
  {
    id: uuidv4(),
    employeeId: "EMP006",
    employeeName: "David Clark",
    jobTitle: "Care Assistant",
    payPeriod: {
      from: "2024-04-01",
      to: "2024-04-30"
    },
    regularHours: 160,
    overtimeHours: 16,
    basicSalary: 2400.00,
    overtimePay: 360.00,
    bonus: 50.00,
    deductions: {
      tax: 450.00,
      nationalInsurance: 200.00,
      pension: 120.00,
      other: 30.00
    },
    grossPay: 2810.00,
    netPay: 2010.00,
    paymentStatus: "failed",
    paymentMethod: "bank_transfer",
    paymentDate: "2024-04-30",
    notes: "Bank account details incorrect"
  },
  {
    id: uuidv4(),
    employeeId: "EMP007",
    employeeName: "Lisa Thompson",
    jobTitle: "Admin Assistant",
    payPeriod: {
      from: "2024-04-01",
      to: "2024-04-30"
    },
    regularHours: 140,
    overtimeHours: 0,
    basicSalary: 1900.00,
    overtimePay: 0.00,
    bonus: 0.00,
    deductions: {
      tax: 300.00,
      nationalInsurance: 150.00,
      pension: 95.00,
      other: 0.00
    },
    grossPay: 1900.00,
    netPay: 1355.00,
    paymentStatus: "pending",
    paymentMethod: "bank_transfer",
    paymentDate: "2024-05-01"
  },
  {
    id: uuidv4(),
    employeeId: "EMP008",
    employeeName: "Robert Jones",
    jobTitle: "Senior Care Assistant",
    payPeriod: {
      from: "2024-04-01",
      to: "2024-04-30"
    },
    regularHours: 160,
    overtimeHours: 8,
    basicSalary: 2400.00,
    overtimePay: 180.00,
    bonus: 75.00,
    deductions: {
      tax: 420.00,
      nationalInsurance: 180.00,
      pension: 120.00,
      other: 0.00
    },
    grossPay: 2655.00,
    netPay: 1935.00,
    paymentStatus: "processed",
    paymentMethod: "bank_transfer",
    paymentDate: "2024-04-30"
  }
];
