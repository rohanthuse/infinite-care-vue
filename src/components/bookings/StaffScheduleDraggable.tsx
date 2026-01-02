import React from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StickyNote, GraduationCap, CalendarCheck, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getBookingStatusColor } from "./utils/bookingColors";
import { Booking } from "./BookingTimeGrid";

interface BookingBlock {
  booking: any;
  startMinutes: number;
  durationMinutes: number;
  leftPosition: number;
  width: number;
  status: string;
  isSplit?: boolean;
  splitType?: 'first' | 'second';
}

interface StaffScheduleDraggableProps {
  staffId: string;
  timeSlots: string[];
  schedule: Record<string, any>;
  bookingBlocks: BookingBlock[];
  slotWidth: number;
  onViewBooking?: (booking: any) => void;
  onCellClick: (staffId: string, timeSlot: string, status: any) => void;
  getStatusColor: (status: any) => string;
  getStatusLabel: (status: any) => string;
  renderTooltipContent: (status: any, staffName: string) => React.ReactNode;
  staffName: string;
  selectedBookings?: Booking[];
  onBookingSelect?: (booking: Booking, selected: boolean) => void;
}

export function StaffScheduleDraggable({
  staffId,
  timeSlots,
  schedule,
  bookingBlocks,
  slotWidth,
  onViewBooking,
  onCellClick,
  getStatusColor,
  getStatusLabel,
  renderTooltipContent,
  staffName,
  selectedBookings = [],
  onBookingSelect
}: StaffScheduleDraggableProps) {
  return (
    <Droppable droppableId={`staff-${staffId}`} type="booking">
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`relative flex ${snapshot.isDraggingOver ? 'bg-primary/5 border-2 border-primary border-dashed' : ''}`}
          style={{ minHeight: '64px' }}
        >
          {/* Time slot grid */}
          {timeSlots.map(slot => {
            const status = schedule[slot];
            return (
              <div
                key={slot}
                className={`
                  border-r last:border-r-0 flex-shrink-0 cursor-pointer transition-colors
                  ${status.type === 'available' ? 'bg-card border-border hover:bg-muted/50' : status.type === 'leave' ? getStatusColor(status) : 'bg-transparent'}
                `}
                style={{ 
                  width: slotWidth,
                  height: '64px'
                }}
                onClick={() => (status.type === 'available' || status.type === 'leave') && onCellClick(staffId, slot, status)}
              >
                {status.type === 'leave' && (
                  <div className="flex items-center justify-center h-full text-xs font-medium">
                    {getStatusLabel(status)}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Draggable booking blocks */}
          {bookingBlocks?.map((block: BookingBlock, idx: number) => {
            const colorClass = getStatusColor({ type: block.status, booking: block.booking });
            const isSplitFirst = block.isSplit && block.splitType === 'first';
            const isSplitSecond = block.isSplit && block.splitType === 'second';
            const isSelected = selectedBookings.some(b => b.id === block.booking.id);
            
            const needsReassignment = 
              block.booking.unavailability_request && 
              (block.booking.unavailability_request.status === 'pending' || 
               block.booking.unavailability_request.status === 'approved');
            
            return (
              <Tooltip key={`staff-${block.booking.id}-${idx}`}>
                <Draggable 
                  draggableId={`staff-${block.booking.id}-${idx}`} 
                  index={idx}
                  isDragDisabled={
                    block.booking.status === 'training' || 
                    block.booking.status === 'meeting'
                  }
                >
                  {(provided, snapshot) => (
                    <TooltipTrigger asChild>
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          absolute top-0 h-full flex items-center justify-center text-xs font-medium cursor-grab active:cursor-grabbing transition-all
                          border border-gray-300 dark:border-gray-600 rounded-sm
                          ${needsReassignment ? 'bg-amber-100 border-amber-500' : colorClass}
                          ${isSplitFirst ? 'border-r-4 border-r-blue-600 border-dashed' : ''}
                          ${isSplitSecond ? 'border-l-4 border-l-blue-600 border-dashed' : ''}
                          ${snapshot.isDragging ? 'shadow-xl opacity-95 rotate-2 scale-105 ring-2 ring-primary' : ''}
                          ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
                        `}
                        style={{ 
                          left: `${block.leftPosition + 1}px`,
                          width: `${Math.max(block.width - 2, 18)}px`,
                          height: '62px',
                          marginTop: '1px',
                          zIndex: snapshot.isDragging ? 1000 : (isSelected ? 2 : 1),
                          ...provided.draggableProps.style
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!snapshot.isDragging && onViewBooking) {
                            onViewBooking(block.booking);
                          }
                        }}
                      >
                        {needsReassignment && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-white px-1.5 py-0.5 text-[9px] font-bold rounded-bl flex items-center gap-0.5 z-20">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Reassign
                          </div>
                        )}
                        {onBookingSelect && block.booking.status !== 'training' && block.booking.status !== 'meeting' && (
                          <div 
                            className="absolute top-1 left-1 z-10 pointer-events-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              onBookingSelect(block.booking, !isSelected);
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              className="h-4 w-4 bg-background border-2"
                            />
                          </div>
                        )}

                        {block.booking.status === 'training' && (
                          <div className="absolute top-1 left-1 z-10 pointer-events-none">
                            <GraduationCap className="h-3 w-3 text-amber-700" />
                          </div>
                        )}

                        {block.booking.status === 'meeting' && (
                          <div className="absolute top-1 left-1 z-10 pointer-events-none">
                            <CalendarCheck className="h-3 w-3 text-indigo-700" />
                          </div>
                        )}

                        {block.booking.notes && block.booking.status !== 'training' && block.booking.status !== 'meeting' && (
                          <div 
                            className="absolute top-1 right-1 z-10 pointer-events-none"
                            title="Has notes"
                          >
                            <div className="bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                              <StickyNote className="h-3 w-3" />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col items-center justify-center px-1 w-full">
                          <div className="font-semibold truncate w-full text-center">
                            {block.booking.clientName}
                          </div>
                          <div className="text-[10px] opacity-75 flex items-center justify-center gap-1">
                            {isSplitSecond && <span className="text-blue-600">←</span>}
                            <span>{block.booking.startTime}-{block.booking.endTime}</span>
                            {isSplitFirst && <span className="text-blue-600">→</span>}
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                  )}
                </Draggable>
                <TooltipContent side="top" className="max-w-sm p-4 bg-popover text-popover-foreground border border-border shadow-lg rounded-md">
                  <div className="text-xs space-y-1">
                    {block.booking.status === 'training' && (
                      <div className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 mb-2">
                        <GraduationCap className="h-3 w-3" />
                        <span>Training Session</span>
                      </div>
                    )}
                    
                    {block.booking.status === 'meeting' && (
                      <div className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
                        <CalendarCheck className="h-3 w-3" />
                        <span>External Meeting</span>
                      </div>
                    )}
                    
                    {renderTooltipContent({ type: block.status, booking: block.booking }, staffName)}
                  </div>
                  {block.booking.splitIndicator === 'continues-next-day' && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      ⚠️ Continues to next day until {block.booking.originalEndTime}
                    </div>
                  )}
                  {block.booking.splitIndicator === 'continued-from-previous-day' && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      ⚠️ Started previous day at {block.booking.originalStartTime}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
