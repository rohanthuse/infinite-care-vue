import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StaffTrendData {
  month: string;
  count: number;
  branchAverage: number;
}

interface StaffPerformanceDrillDownProps {
  staffName: string;
  trendData: StaffTrendData[];
  currentCount: number;
  averageCount: number;
  type: 'missed-calls' | 'late-arrivals';
}

export function StaffPerformanceDrillDown({
  staffName,
  trendData,
  currentCount,
  averageCount,
  type,
}: StaffPerformanceDrillDownProps) {
  const trend = calculateTrend(trendData);
  const comparison = currentCount - averageCount;
  
  const metricName = type === 'missed-calls' ? 'Missed Calls' : 'Late Arrivals';
  
  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{staffName} - Performance Details</h4>
        <div className="flex items-center gap-2">
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-destructive" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-success" />}
          {trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">
            {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Improving' : 'Stable'}
          </span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Current Period</p>
          <p className="text-lg font-bold">{currentCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Branch Average</p>
          <p className="text-lg font-bold">{averageCount.toFixed(1)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">vs Average</p>
          <Badge variant={comparison > 0 ? "destructive" : comparison < 0 ? "default" : "secondary"}>
            {comparison > 0 ? '+' : ''}{comparison.toFixed(1)}
          </Badge>
        </div>
      </div>

      {/* Trend Chart */}
      {trendData && trendData.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">6-Month Trend</p>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  name={staffName}
                  dot={{ fill: 'hsl(var(--destructive))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="branchAverage" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Branch Avg"
                  dot={{ fill: 'hsl(var(--muted-foreground))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {/* Insights */}
      <div className="mt-4 p-3 bg-background rounded border border-border">
        <p className="text-xs font-medium mb-1">Performance Insights</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          {comparison > 2 && (
            <li className="text-destructive">
              Above branch average - may need support or training
            </li>
          )}
          {comparison < -2 && (
            <li className="text-success">
              Below branch average - performing well
            </li>
          )}
          {trend === 'up' && (
            <li className="text-warning">
              Increasing trend - recommend intervention
            </li>
          )}
          {trend === 'down' && (
            <li className="text-success">
              Improving trend - positive progress
            </li>
          )}
          {Math.abs(comparison) <= 2 && (
            <li>
              Performance aligned with branch average
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function calculateTrend(data: StaffTrendData[]): 'up' | 'down' | 'stable' {
  if (!data || data.length < 3) return 'stable';
  
  const recentData = data.slice(-3);
  const first = recentData[0].count;
  const last = recentData[recentData.length - 1].count;
  
  const change = last - first;
  
  if (change > 1) return 'up';
  if (change < -1) return 'down';
  return 'stable';
}
