import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface ReasonData {
  reason: string;
  count: number;
  percentage?: number;
}

interface ReasonBreakdownCardProps {
  data: ReasonData[];
  title: string;
  colors?: string[];
  showPercentages?: boolean;
}

const DEFAULT_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ReasonBreakdownCard({ 
  data, 
  title, 
  colors = DEFAULT_COLORS,
  showPercentages = false 
}: ReasonBreakdownCardProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No reason data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const topReasons = data.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{title} - Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topReasons}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ count, percentage }) => 
                    showPercentages ? `${percentage}%` : count
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="reason"
                >
                  {topReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{title} - Top Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="reason" 
                  width={120}
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          {/* Summary List */}
          <div className="mt-4 space-y-2">
            {topReasons.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-foreground truncate max-w-[200px]">{item.reason}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{item.count}</Badge>
                  {showPercentages && item.percentage && (
                    <span className="text-muted-foreground">{item.percentage}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
