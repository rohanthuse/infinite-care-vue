import React from 'react';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { useBookingData } from './hooks/useBookingData';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface BookingDebugPanelProps {
  branchId?: string;
  selectedDate: Date;
}

export const BookingDebugPanel: React.FC<BookingDebugPanelProps> = ({ 
  branchId, 
  selectedDate 
}) => {
  const { user, loading: authLoading, error: authError } = useAuthSafe();
  const { clients, carers, bookings, isLoading } = useBookingData(branchId);
  
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const bookingsForSelectedDate = bookings.filter(b => b.date === selectedDateString);
  
  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-semibold text-sm mb-2">🐛 Booking Debug Panel</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Auth:</strong>
          <Badge variant={user ? "default" : "destructive"} className="ml-1">
            {user ? `✓ ${user.email}` : "❌ Not Auth'd"}
          </Badge>
        </div>
        
        <div>
          <strong>Selected Date:</strong> {selectedDateString}
        </div>
        
        <div>
          <strong>Total Bookings:</strong> {bookings.length}
          {isLoading && <span className="text-muted-foreground"> (loading...)</span>}
        </div>
        
        <div>
          <strong>Bookings for {selectedDateString}:</strong> {bookingsForSelectedDate.length}
        </div>
        
        {bookingsForSelectedDate.length > 0 && (
          <div>
            <strong>Sample:</strong>
            <div className="text-xs text-muted-foreground">
              {bookingsForSelectedDate.slice(0, 2).map(b => (
                <div key={b.id}>
                  {b.startTime}-{b.endTime} {b.clientName}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <strong>Clients:</strong> {clients.length} | <strong>Carers:</strong> {carers.length}
        </div>
        
        {authError && (
          <div className="text-destructive text-xs">
            <strong>Auth Error:</strong> {authError}
          </div>
        )}
      </div>
    </div>
  );
};