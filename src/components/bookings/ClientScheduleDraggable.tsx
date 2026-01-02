import React from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StickyNote } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Booking } from "./BookingTimeGrid";
import { getRequestStatusColors } from "./utils/requestIndicatorHelpers";

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

interface ClientScheduleDraggableProps {
  clientId: string;
  clientName: string;
  timeSlots: string[];
  schedule: Record<string, any>;
  bookingBlocks: BookingBlock[];
  slotWidth: number;
  onViewBooking?: (booking: any) => void;
  onCellClick: (clientId: string, timeSlot: string, status: any) => void;
  getStatusColor: (status: any) => string;
  renderTooltipContent: (status: any, clientName: string) => React.ReactNode;
  selectedBookings?: Booking[];
  onBookingSelect?: (booking: Booking, selected: boolean) => void;
}

export function ClientScheduleDraggable({
  clientId,
  clientName,
  timeSlots,
  schedule,
  bookingBlocks,
  slotWidth,
  onViewBooking,
  onCellClick,
  getStatusColor,
  renderTooltipContent,
  selectedBookings = [],
  onBookingSelect
}: ClientScheduleDraggableProps) {
  return (
    <Droppable droppableId={`client-${clientId}`} type="booking">
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`relative flex ${snapshot.isDraggingOver ? 'bg-primary/5 border-2 border-primary border-dashed' : ''}`}
          style={{ minHeight: '80px' }}
        >
          {/* Time slot grid */}
          {timeSlots.map(slot => {
            const status = schedule[slot];
            return (
              <div
                key={slot}
                className={`
                  border-r last:border-r-0 flex-shrink-0 cursor-pointer transition-colors
                  ${status.type === 'available' ? 'bg-background border-border hover:bg-muted/50' : 'bg-transparent'}
                `}
                style={{ 
                  width: slotWidth,
                  height: '80px'
                }}
                onClick={() => status.type === 'available' && onCellClick(clientId, slot, status)}
              />
            );
          })}
          
          {/* Draggable booking blocks */}
          {bookingBlocks?.map((block: BookingBlock, idx: number) => {
            const requestColors = getRequestStatusColors(block.booking);
            const RequestIcon = requestColors.icon;
            
            // If there's a pending request, override the status color
            const colorClass = requestColors.hasRequest 
              ? `${requestColors.background} ${requestColors.text}` 
              : getStatusColor({ type: block.status, booking: block.booking });
            
            const isSplitFirst = block.isSplit && block.splitType === 'first';
            const isSplitSecond = block.isSplit && block.splitType === 'second';
            const isSelected = selectedBookings.some(b => b.id === block.booking.id);
            
            // Disable drag for training/meeting bookings
            const isDragDisabled = 
              block.booking.status === 'training' || 
              block.booking.status === 'meeting';
            
            return (
              <Tooltip key={`client-${block.booking.id}-${idx}`}>
                <Draggable 
                  draggableId={`client-${block.booking.id}-${idx}`} 
                  index={idx}
                  isDragDisabled={isDragDisabled}
                >
                  {(provided, snapshot) => (
                    <TooltipTrigger asChild>
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          absolute top-0 h-full flex items-center justify-center text-xs font-medium 
                          ${isDragDisabled ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
                          transition-all border border-gray-300 dark:border-gray-600 rounded-sm
                          ${colorClass}
                          ${requestColors.hasRequest ? requestColors.border : ''}
                          ${isSplitFirst ? 'border-r-4 border-r-blue-600 border-dashed' : ''}
                          ${isSplitSecond ? 'border-l-4 border-l-blue-600 border-dashed' : ''}
                          ${snapshot.isDragging ? 'shadow-xl opacity-95 rotate-2 scale-105 ring-2 ring-primary' : ''}
                          ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
                        `}
                        style={{ 
                          left: `${block.leftPosition + 1}px`,
                          width: `${Math.max(block.width - 2, 18)}px`,
                          height: '78px',
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
                        {/* Selection checkbox */}
                        {onBookingSelect && !isDragDisabled && (
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

                        {/* Request indicator - top right */}
                        {requestColors.hasRequest && (
                          <div className="absolute top-1 right-1 z-10">
                            <div className={`w-2 h-2 rounded-full ${requestColors.dotColor} animate-pulse`} />
                          </div>
                        )}

                        {/* Notes indicator */}
                        {block.booking.notes && !requestColors.hasRequest && (
                          <div 
                            className="absolute top-1 right-1 z-10 pointer-events-none"
                            title="Has notes"
                          >
                            <div className="bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                              <StickyNote className="h-3 w-3" />
                            </div>
                          </div>
                        )}

                        {/* Card content */}
                        <div className="flex flex-col items-center justify-center px-1 w-full">
                          <div className="font-semibold truncate w-full text-center">
                            {(block.booking as any).allCarerNames?.length > 1 
                              ? `${(block.booking as any).allCarerNames.length} Carers`
                              : block.booking.carerName || 'Unassigned'}
                          </div>
                          <div className="text-[10px] opacity-75 flex items-center justify-center gap-1">
                            {isSplitSecond && <span className="text-blue-600">←</span>}
                            <span>{block.booking.startTime}-{block.booking.endTime}</span>
                            {isSplitFirst && <span className="text-blue-600">→</span>}
                          </div>
                          
                          {/* Request icon indicator */}
                          {requestColors.hasRequest && RequestIcon && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <RequestIcon className={`h-2.5 w-2.5 ${requestColors.iconColor}`} />
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                  )}
                </Draggable>
                
                <TooltipContent side="top" className="max-w-sm p-4 bg-popover text-popover-foreground border border-border shadow-lg rounded-md">
                  <div className="text-xs space-y-1">
                    {requestColors.hasRequest && (
                      <div className="font-bold text-amber-700 dark:text-amber-400 mb-2 pb-2 border-b">
                        ⚠️ {requestColors.tooltip}
                      </div>
                    )}
                    {renderTooltipContent({ type: block.status, booking: block.booking }, clientName)}
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
