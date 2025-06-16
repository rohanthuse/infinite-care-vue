
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Booking } from "@/components/bookings/BookingTimeGrid";
import jsPDF from "jspdf";
import "jspdf-autotable";

export interface ReportData {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageDuration: number;
  completionRate: number;
  topCarers: Array<{ name: string; bookings: number; completionRate: number }>;
  topClients: Array<{ name: string; bookings: number }>;
  statusBreakdown: Record<string, number>;
  dailyStats?: Array<{ date: string; bookings: number; revenue: number }>;
  weeklyStats?: Array<{ week: string; bookings: number; revenue: number }>;
  monthlyStats?: Array<{ month: string; bookings: number; revenue: number }>;
}

export interface ReportFilters {
  dateRange: { from: Date; to: Date };
  status?: string;
  carerId?: string;
  clientId?: string;
  reportType: string;
}

export class ReportGenerator {
  
  static generateReportData(bookings: Booking[], filters: ReportFilters): ReportData {
    const filteredBookings = this.filterBookings(bookings, filters);
    
    const totalBookings = filteredBookings.length;
    const completedBookings = filteredBookings.filter(b => b.status === 'done').length;
    const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    
    // Calculate total revenue (assuming some bookings have revenue data)
    const totalRevenue = filteredBookings.reduce((sum, booking) => {
      // Since our Booking interface doesn't have revenue, we'll simulate it
      // In a real app, you'd have this data from the database
      return sum + this.estimateBookingRevenue(booking);
    }, 0);

    // Calculate average duration
    const averageDuration = this.calculateAverageDuration(filteredBookings);

    // Status breakdown
    const statusBreakdown = filteredBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top carers
    const carerStats = this.getCarerStats(filteredBookings);
    const topCarers = Object.entries(carerStats)
      .map(([name, stats]) => ({
        name,
        bookings: stats.total,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    // Top clients
    const clientStats = this.getClientStats(filteredBookings);
    const topClients = Object.entries(clientStats)
      .map(([name, count]) => ({ name, bookings: count }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    let dailyStats, weeklyStats, monthlyStats;

    // Generate time-based stats based on report type
    if (filters.reportType === 'daily') {
      dailyStats = this.getDailyStats(filteredBookings, filters.dateRange);
    } else if (filters.reportType === 'weekly') {
      weeklyStats = this.getWeeklyStats(filteredBookings, filters.dateRange);
    } else if (filters.reportType === 'monthly') {
      monthlyStats = this.getMonthlyStats(filteredBookings, filters.dateRange);
    }

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      averageDuration,
      completionRate,
      topCarers,
      topClients,
      statusBreakdown,
      dailyStats,
      weeklyStats,
      monthlyStats
    };
  }

  private static filterBookings(bookings: Booking[], filters: ReportFilters): Booking[] {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      
      // Date range filter
      if (bookingDate < filters.dateRange.from || bookingDate > filters.dateRange.to) {
        return false;
      }
      
      // Status filter
      if (filters.status && filters.status !== 'all' && booking.status !== filters.status) {
        return false;
      }
      
      // Carer filter
      if (filters.carerId && filters.carerId !== 'all' && booking.carerId !== filters.carerId) {
        return false;
      }
      
      // Client filter
      if (filters.clientId && filters.clientId !== 'all' && booking.clientId !== filters.clientId) {
        return false;
      }
      
      return true;
    });
  }

  private static estimateBookingRevenue(booking: Booking): number {
    // Simulate revenue calculation based on duration and service type
    const duration = this.calculateBookingDuration(booking);
    const baseRate = 25; // £25 per hour base rate
    return (duration / 60) * baseRate;
  }

  private static calculateBookingDuration(booking: Booking): number {
    const [startHour, startMin] = booking.startTime.split(':').map(Number);
    const [endHour, endMin] = booking.endTime.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  }

  private static calculateAverageDuration(bookings: Booking[]): number {
    if (bookings.length === 0) return 0;
    const totalDuration = bookings.reduce((sum, booking) => {
      return sum + this.calculateBookingDuration(booking);
    }, 0);
    return totalDuration / bookings.length;
  }

  private static getCarerStats(bookings: Booking[]): Record<string, { total: number; completed: number }> {
    return bookings.reduce((acc, booking) => {
      if (!acc[booking.carerName]) {
        acc[booking.carerName] = { total: 0, completed: 0 };
      }
      acc[booking.carerName].total++;
      if (booking.status === 'done') {
        acc[booking.carerName].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);
  }

  private static getClientStats(bookings: Booking[]): Record<string, number> {
    return bookings.reduce((acc, booking) => {
      acc[booking.clientName] = (acc[booking.clientName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private static getDailyStats(bookings: Booking[], dateRange: { from: Date; to: Date }) {
    const dailyMap = new Map<string, { bookings: number; revenue: number }>();
    
    bookings.forEach(booking => {
      const date = booking.date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { bookings: 0, revenue: 0 });
      }
      const stats = dailyMap.get(date)!;
      stats.bookings++;
      stats.revenue += this.estimateBookingRevenue(booking);
    });

    return Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date: format(new Date(date), 'MMM dd'),
      bookings: stats.bookings,
      revenue: stats.revenue
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private static getWeeklyStats(bookings: Booking[], dateRange: { from: Date; to: Date }) {
    const weeklyMap = new Map<string, { bookings: number; revenue: number }>();
    
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.date);
      const weekStart = startOfWeek(bookingDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'MMM dd');
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { bookings: 0, revenue: 0 });
      }
      const stats = weeklyMap.get(weekKey)!;
      stats.bookings++;
      stats.revenue += this.estimateBookingRevenue(booking);
    });

    return Array.from(weeklyMap.entries()).map(([week, stats]) => ({
      week,
      bookings: stats.bookings,
      revenue: stats.revenue
    }));
  }

  private static getMonthlyStats(bookings: Booking[], dateRange: { from: Date; to: Date }) {
    const monthlyMap = new Map<string, { bookings: number; revenue: number }>();
    
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.date);
      const monthKey = format(bookingDate, 'MMM yyyy');
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { bookings: 0, revenue: 0 });
      }
      const stats = monthlyMap.get(monthKey)!;
      stats.bookings++;
      stats.revenue += this.estimateBookingRevenue(booking);
    });

    return Array.from(monthlyMap.entries()).map(([month, stats]) => ({
      month,
      bookings: stats.bookings,
      revenue: stats.revenue
    }));
  }

  static generatePDF(reportData: ReportData, filters: ReportFilters, branchName: string): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(`${branchName} - Booking Report`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Report Type: ${filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1)}`, 20, 35);
    doc.text(`Date Range: ${format(filters.dateRange.from, 'MMM dd, yyyy')} - ${format(filters.dateRange.to, 'MMM dd, yyyy')}`, 20, 45);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 55);

    // Summary Statistics
    doc.setFontSize(16);
    doc.text('Summary Statistics', 20, 75);
    
    const summaryData = [
      ['Total Bookings', reportData.totalBookings.toString()],
      ['Completed Bookings', reportData.completedBookings.toString()],
      ['Cancelled Bookings', reportData.cancelledBookings.toString()],
      ['Completion Rate', `${reportData.completionRate.toFixed(1)}%`],
      ['Total Revenue', `£${reportData.totalRevenue.toFixed(2)}`],
      ['Average Duration', `${reportData.averageDuration.toFixed(0)} minutes`]
    ];

    (doc as any).autoTable({
      startY: 85,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    // Top Carers
    if (reportData.topCarers.length > 0) {
      doc.setFontSize(16);
      doc.text('Top Performing Carers', 20, (doc as any).lastAutoTable.finalY + 20);
      
      const carerData = reportData.topCarers.map(carer => [
        carer.name,
        carer.bookings.toString(),
        `${carer.completionRate.toFixed(1)}%`
      ]);

      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 30,
        head: [['Carer Name', 'Total Bookings', 'Completion Rate']],
        body: carerData,
        theme: 'grid',
        styles: { fontSize: 10 }
      });
    }

    // Status Breakdown
    doc.setFontSize(16);
    doc.text('Booking Status Breakdown', 20, (doc as any).lastAutoTable.finalY + 20);
    
    const statusData = Object.entries(reportData.statusBreakdown).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      count.toString(),
      `${((count / reportData.totalBookings) * 100).toFixed(1)}%`
    ]);

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 30,
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    // Save the PDF
    doc.save(`booking-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
  }

  static generateCSV(bookings: Booking[], filters: ReportFilters): void {
    const filteredBookings = this.filterBookings(bookings, filters);
    
    const headers = ['ID', 'Date', 'Start Time', 'End Time', 'Client', 'Carer', 'Status', 'Duration (mins)', 'Estimated Revenue'];
    
    const csvData = filteredBookings.map(booking => [
      booking.id,
      booking.date,
      booking.startTime,
      booking.endTime,
      booking.clientName,
      booking.carerName,
      booking.status,
      this.calculateBookingDuration(booking).toString(),
      `£${this.estimateBookingRevenue(booking).toFixed(2)}`
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `booking-data-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
