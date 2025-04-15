
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ComplianceReportsProps {
  branchId: string;
  branchName: string;
}

// Mock data for compliance reports
const trainingComplianceData = [
  { name: "First Aid", compliant: 90, noncompliant: 10 },
  { name: "Safeguarding", compliant: 95, noncompliant: 5 },
  { name: "Medication", compliant: 85, noncompliant: 15 },
  { name: "Manual Handling", compliant: 92, noncompliant: 8 },
  { name: "Infection Control", compliant: 88, noncompliant: 12 },
];

const incidentTypeData = [
  { name: "Medication Error", value: 15 },
  { name: "Fall", value: 22 },
  { name: "Missed Visit", value: 18 },
  { name: "Client Complaint", value: 12 },
  { name: "Staff Issue", value: 8 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ComplianceReports({ branchId, branchName }: ComplianceReportsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Training Compliance</h3>
          <div className="h-80 w-full">
            <ChartContainer 
              config={{
                compliant: { color: "#00C49F" },
                noncompliant: { color: "#FF8042" },
              }}
            >
              <BarChart
                data={trainingComplianceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="compliant" name="Compliant %" fill="var(--color-compliant)" stackId="a" />
                <Bar dataKey="noncompliant" name="Non-compliant %" fill="var(--color-noncompliant)" stackId="a" />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows compliance percentages for various training requirements.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Incident Types</h3>
          <div className="h-80 w-full flex justify-center">
            <ChartContainer 
              config={{
                primary: { color: "#0088FE" },
              }}
            >
              <PieChart width={400} height={300}>
                <Pie
                  data={incidentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {incidentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} incidents`, 'Count']} />
                <Legend />
              </PieChart>
            </ChartContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows the distribution of different types of incidents reported.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
