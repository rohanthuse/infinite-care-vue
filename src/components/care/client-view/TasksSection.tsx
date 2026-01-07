import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TasksSectionProps {
  tasks: Array<{
    name?: string;
    category?: string;
    description?: string;
    priority?: string;
    time_of_day?: string[];
  }>;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  personal_care: { bg: 'bg-blue-100', text: 'text-blue-800' },
  medication: { bg: 'bg-purple-100', text: 'text-purple-800' },
  mobility: { bg: 'bg-green-100', text: 'text-green-800' },
  nutrition: { bg: 'bg-orange-100', text: 'text-orange-800' },
  communication: { bg: 'bg-teal-100', text: 'text-teal-800' },
  safety: { bg: 'bg-red-100', text: 'text-red-800' },
  social: { bg: 'bg-pink-100', text: 'text-pink-800' },
  household: { bg: 'bg-amber-100', text: 'text-amber-800' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-slate-100', text: 'text-slate-700' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800' },
  urgent: { bg: 'bg-red-100', text: 'text-red-800' },
};

const formatCategory = (category: string) => {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatTimeOfDay = (timeOfDay?: string[]) => {
  if (!timeOfDay || timeOfDay.length === 0) return null;
  return timeOfDay.join(', ');
};

export function TasksSection({ tasks }: TasksSectionProps) {
  const data = tasks || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary" />
          Care Tasks ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
            <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tasks have been defined yet.</p>
            <p className="text-sm">Tasks can be added during care plan creation.</p>
          </div>
        ) : (
          data.map((task, idx) => {
            const categoryStyle = CATEGORY_COLORS[task.category || 'other'] || CATEGORY_COLORS.other;
            const priorityStyle = PRIORITY_COLORS[task.priority || 'medium'] || PRIORITY_COLORS.medium;
            const timeOfDayFormatted = formatTimeOfDay(task.time_of_day);

            return (
              <Card key={idx} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{task.name || 'Untitled Task'}</h4>
                        {task.description && (
                          <div className="mt-1 max-h-[100px] overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge className={`${categoryStyle.bg} ${categoryStyle.text} border-0`}>
                          {formatCategory(task.category || 'other')}
                        </Badge>
                        <Badge className={`${priorityStyle.bg} ${priorityStyle.text} border-0`}>
                          {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                        </Badge>
                      </div>
                    </div>

                    {timeOfDayFormatted && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{timeOfDayFormatted}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
