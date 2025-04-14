
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

interface EventLogFormProps {
  branchId: string;
}

export function EventLogForm({ branchId }: EventLogFormProps) {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate submission
    setTimeout(() => {
      setLoading(false);
      toast.success('Event created successfully', {
        description: 'Your event has been logged and is pending review.'
      });
      
      // Reset form (this would normally be handled by form state)
      const form = e.target as HTMLFormElement;
      form.reset();
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Event Title*
            </label>
            <Input id="title" placeholder="Enter event title" required />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Category*
            </label>
            <Select required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="near_miss">Near Miss</SelectItem>
                <SelectItem value="medication_error">Medication Error</SelectItem>
                <SelectItem value="safeguarding">Safeguarding</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="compliment">Compliment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="event-type" className="block text-sm font-medium mb-1">
              Event Type*
            </label>
            <Select required>
              <SelectTrigger id="event-type">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client Related</SelectItem>
                <SelectItem value="staff">Staff Related</SelectItem>
                <SelectItem value="facility">Facility Related</SelectItem>
                <SelectItem value="equipment">Equipment Related</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="client" className="block text-sm font-medium mb-1">
              Client Name (if applicable)
            </label>
            <Select>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="james-wilson">James Wilson</SelectItem>
                <SelectItem value="emma-williams">Emma Williams</SelectItem>
                <SelectItem value="daniel-smith">Daniel Smith</SelectItem>
                <SelectItem value="sophia-martinez">Sophia Martinez</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="staff" className="block text-sm font-medium mb-1">
              Staff Member (if applicable)
            </label>
            <Select>
              <SelectTrigger id="staff">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                <SelectItem value="michael-brown">Michael Brown</SelectItem>
                <SelectItem value="lisa-taylor">Lisa Taylor</SelectItem>
                <SelectItem value="david-miller">David Miller</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1">
              Event Date*
            </label>
            <Input id="date" type="date" required />
          </div>
          
          <div>
            <label htmlFor="time" className="block text-sm font-medium mb-1">
              Event Time*
            </label>
            <Input id="time" type="time" required />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">
              Location*
            </label>
            <Input id="location" placeholder="Enter location" required />
          </div>
          
          <div>
            <label htmlFor="witness" className="block text-sm font-medium mb-1">
              Witnesses (if any)
            </label>
            <Input id="witness" placeholder="Enter witnesses" />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">
              Initial Status*
            </label>
            <Select required>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending Review">Pending Review</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="details" className="block text-sm font-medium mb-1">
            Event Details*
          </label>
          <Textarea
            id="details"
            placeholder="Provide a detailed description of the event..."
            className="min-h-[120px]"
            required
          />
        </div>
        
        <div>
          <label htmlFor="actions" className="block text-sm font-medium mb-1">
            Immediate Actions Taken
          </label>
          <Textarea
            id="actions"
            placeholder="Describe any immediate actions taken..."
            className="min-h-[100px]"
          />
        </div>
      </div>
      
      <div>
        <Button type="button" variant="outline" className="mr-3">
          Save as Draft
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Event"}
        </Button>
      </div>
    </form>
  );
}
