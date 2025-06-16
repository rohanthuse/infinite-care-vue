
import { format } from "date-fns";
import { generateBookingReportPDF, generateClientReportPDF, generateStaffReportPDF } from "./enhancedPdfGenerator";

export interface ReportData {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  completionRate: number;
  totalRevenue: number;
  averageDuration: number;
  topCarers: Array<{
    name: string;
    bookings: number;
    completionRate: number;
  }>;
  topClients: Array<{
    name: string;
    bookings: number;
  }>;
}

export interface ReportFilters {
  dateRange: { from: Date; to: Date };
  status?: string;
  carerId?: string;
  clientId?: string;
  reportType: string;
}

interface CarerStats {
  name: string;
  total: number;
  completed: number;
}

interface ClientStats {
  name: string;
  bookings: number;
}

export class ReportGenerator {
  static generateReportData(bookings: any[], filters: Partial<ReportFilters>): ReportData {
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'done').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Calculate total revenue (estimated)
    const totalRevenue = bookings.reduce((sum, booking) => {
      const [startHour, startMin] = booking.startTime.split(':').map(Number);
      const [endHour, endMin] = booking.endTime.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      return sum + (duration / 60) * 25; // £25 per hour base rate
    }, 0);

    // Calculate average duration
    const totalDuration = bookings.reduce((sum, booking) => {
      const [startHour, startMin] = booking.startTime.split(':').map(Number);
      const [endHour, endMin] = booking.endTime.split(':').map(Number);
      return sum + ((endHour * 60 + endMin) - (startHour * 60 + startMin));
    }, 0);
    const averageDuration = totalBookings > 0 ? totalDuration / totalBookings : 0;

    // Calculate top carers
    const carerStats = bookings.reduce((acc: Record<string, CarerStats>, booking) => {
      if (!booking.carerId || !booking.carerName) return acc;
      
      if (!acc[booking.carerId]) {
        acc[booking.carerId] = {
          name: booking.carerName,
          total: 0,
          completed: 0
        };
      }
      
      acc[booking.carerId].total++;
      if (booking.status === 'done') {
        acc[booking.carerId].completed++;
      }
      
      return acc;
    }, {});

    const topCarers = Object.values(carerStats)
      .map((carer: CarerStats) => ({
        name: carer.name,
        bookings: carer.total,
        completionRate: carer.total > 0 ? (carer.completed / carer.total) * 100 : 0
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    // Calculate top clients
    const clientStats = bookings.reduce((acc: Record<string, ClientStats>, booking) => {
      if (!booking.clientId || !booking.clientName) return acc;
      
      if (!acc[booking.clientId]) {
        acc[booking.clientId] = {
          name: booking.clientName,
          bookings: 0
        };
      }
      
      acc[booking.clientId].bookings++;
      return acc;
    }, {});

    const topClients = Object.values(clientStats)
      .sort((a: ClientStats, b: ClientStats) => b.bookings - a.bookings)
      .slice(0, 5);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate,
      totalRevenue,
      averageDuration,
      topCarers,
      topClients
    };
  }

  static generatePDF(reportData: ReportData, filters: Partial<ReportFilters>, branchName: string): void {
    // Use the enhanced PDF generator for consistent branding
    if (filters.reportType === 'booking' || !filters.reportType) {
      generateBookingReportPDF([], filters, branchName, "Booking Summary Report");
    }
  }

  static generateCSV(bookings: any[], filters: Partial<ReportFilters>): void {
    const csvHeaders = ["Date", "Start Time", "End Time", "Client", "Carer", "Status", "Duration (mins)", "Revenue"];
    
    const csvData = bookings.map(booking => {
      const [startHour, startMin] = booking.startTime.split(':').map(Number);
      const [endHour, endMin] = booking.endTime.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      const revenue = (duration / 60) * 25;
      
      return [
        format(new Date(booking.date), 'yyyy-MM-dd'),
        booking.startTime,
        booking.endTime,
        booking.clientName || 'N/A',
        booking.carerName || 'N/A',
        booking.status,
        duration.toString(),
        `£${revenue.toFixed(2)}`
      ];
    });

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Med-Infinite_Report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
