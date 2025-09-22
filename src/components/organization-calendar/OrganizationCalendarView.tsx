import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Users,
  Clock,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { DateNavigation } from '@/components/bookings/DateNavigation';
import { CalendarDayView } from './CalendarDayView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarMonthView } from './CalendarMonthView';
import { useOrganizationCalendar } from '@/hooks/useOrganizationCalendar';
import { format } from 'date-fns';

type ViewType = 'daily' | 'weekly' | 'monthly';

export const OrganizationCalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  const { data: calendarEvents, isLoading } = useOrganizationCalendar({
    date: currentDate,
    viewType,
    searchTerm,
    branchId: selectedBranch !== 'all' ? selectedBranch : undefined,
    eventType: selectedEventType !== 'all' ? selectedEventType : undefined,
  });

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleViewTypeChange = (type: ViewType) => {
    setViewType(type);
  };

  const handleExportCalendar = () => {
    // Export calendar functionality
    console.log('Exporting calendar data...');
  };

  const eventTypeColors = {
    booking: 'bg-blue-500',
    meeting: 'bg-purple-500',
    leave: 'bg-orange-500',
    training: 'bg-green-500',
    agreement: 'bg-yellow-500'
  };

  const renderCalendarView = () => {
    switch (viewType) {
      case 'daily':
        return (
          <CalendarDayView 
            date={currentDate}
            events={calendarEvents}
            isLoading={isLoading}
          />
        );
      case 'weekly':
        return (
          <CalendarWeekView 
            date={currentDate}
            events={calendarEvents}
            isLoading={isLoading}
          />
        );
      case 'monthly':
        return (
          <CalendarMonthView 
            date={currentDate}
            events={calendarEvents}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Organization Calendar</h1>
          </div>
          <Badge variant="secondary" className="text-sm">
            {format(currentDate, 'MMMM yyyy')}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCalendar}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Date Navigation */}
            <div className="flex-1">
              <DateNavigation
                currentDate={currentDate}
                onDateChange={handleDateChange}
                viewType={viewType}
                onViewTypeChange={handleViewTypeChange}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Branch Filter */}
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="main">Main Branch</SelectItem>
                  <SelectItem value="north">North Branch</SelectItem>
                  <SelectItem value="south">South Branch</SelectItem>
                </SelectContent>
              </Select>

              {/* Event Type Filter */}
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="booking">Bookings</SelectItem>
                  <SelectItem value="meeting">Meetings</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="agreement">Agreements</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(eventTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm capitalize text-foreground">{type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card className="flex-1">
        <CardContent className="p-0">
          {renderCalendarView()}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-foreground">
                  {calendarEvents?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold text-foreground">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="text-2xl font-bold text-foreground">78%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conflicts</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};