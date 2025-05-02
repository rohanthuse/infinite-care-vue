
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Phone, HelpCircle } from "lucide-react";

const formSchema = z.object({
  subject: z.string({
    required_error: "Please select a subject",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
  priority: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ClientSupport = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      message: "",
      priority: "normal"
    },
  });

  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);
    
    // In a real application, this would send data to your backend
    setTimeout(() => {
      console.log("Form data submitted:", data);
      toast({
        title: "Message sent successfully",
        description: "Thank you for your inquiry. Our team will respond within 24 hours.",
      });
      form.reset();
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Contact Information Card */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center">
            <HelpCircle className="mr-2 h-6 w-6 text-blue-600" />
            Help & Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Contact Us</h3>
              <p className="text-gray-600 mb-4">
                Our support team is here to help you with any questions or issues you may have.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-blue-600" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <a href="mailto:support@med-infinite.com" className="text-blue-600 hover:underline">
                      support@med-infinite.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-blue-600" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <a href="tel:+18005551234" className="text-blue-600 hover:underline">
                      +1 (800) 555-1234
                    </a>
                    <p className="text-sm text-gray-500">Mon-Fri: 9am - 5pm</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium mb-2">Support Hours</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span>9:00 AM - 5:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Saturday:</span>
                  <span>10:00 AM - 2:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday:</span>
                  <span>Closed</span>
                </li>
              </ul>
              <div className="mt-4 text-sm text-gray-600">
                <p>Emergency support available 24/7 for urgent medical matters.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Form Card */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Send Us a Message</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject for your inquiry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="service">Service Feedback</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low - General Question</SelectItem>
                        <SelectItem value="normal">Normal - Need Help</SelectItem>
                        <SelectItem value="high">High - Urgent Issue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Please select the appropriate priority for your inquiry.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe your question or issue in detail..." 
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* FAQ Section */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-medium mb-2">How do I reschedule an appointment?</h3>
              <p className="text-gray-600">
                You can reschedule an appointment by going to the Appointments section, finding your scheduled 
                appointment, and clicking the "Reschedule" button. Appointments can be rescheduled up to 24 hours before
                the scheduled time.
              </p>
            </div>
            
            <div className="border-b pb-3">
              <h3 className="font-medium mb-2">How do I update my personal information?</h3>
              <p className="text-gray-600">
                To update your personal information, navigate to the Profile section in your dashboard. 
                There you can edit your contact details, address, and other personal information.
              </p>
            </div>
            
            <div className="border-b pb-3">
              <h3 className="font-medium mb-2">Where can I find my care plan documents?</h3>
              <p className="text-gray-600">
                Your care plan documents can be found in the "Care Plans" section of your dashboard. 
                You can view, download, and print these documents as needed.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">How do I pay my bill online?</h3>
              <p className="text-gray-600">
                You can pay your bills by going to the Payments section of your dashboard. 
                We accept all major credit cards and provide secure payment processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSupport;
