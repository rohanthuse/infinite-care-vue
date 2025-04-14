
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { CalendarIcon, Trash2, Clock } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Action {
  id: string;
  text: string;
  date: Date;
}

interface ActionsListProps {
  actions: Action[];
  setActions: React.Dispatch<React.SetStateAction<Action[]>>;
}

export function ActionsList({ actions, setActions }: ActionsListProps) {
  const handleActionChange = (id: string, text: string) => {
    setActions(prev => prev.map(action => 
      action.id === id ? { ...action, text } : action
    ));
  };

  const handleDateChange = (id: string, date: Date) => {
    setActions(prev => prev.map(action => 
      action.id === id ? { ...action, date } : action
    ));
  };

  const handleRemoveAction = (id: string) => {
    setActions(prev => prev.filter(action => action.id !== id));
  };

  if (actions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No actions added yet. Click the button above to add a new action.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action, index) => (
        <div 
          key={action.id} 
          className="p-4 border border-gray-200 rounded-lg bg-white"
        >
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Action #{index + 1}</h4>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => handleRemoveAction(action.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor={`action-text-${action.id}`}>Action details</Label>
              <Textarea
                id={`action-text-${action.id}`}
                value={action.text}
                onChange={(e) => handleActionChange(action.id, e.target.value)}
                placeholder="Describe the action to be taken"
                className="mt-1"
              />
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor={`action-date-${action.id}`}>Due date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={`action-date-${action.id}`}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !action.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {action.date ? format(action.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={action.date}
                      onSelect={(date) => date && handleDateChange(action.id, date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex-1">
                <Label htmlFor={`action-time-${action.id}`}>Due time</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={`action-time-${action.id}`}
                    type="time"
                    className="pl-10"
                    defaultValue="12:00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
