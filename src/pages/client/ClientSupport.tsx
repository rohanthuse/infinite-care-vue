import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Phone, HelpCircle } from "lucide-react";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";
import { useBranchAdmins } from "@/hooks/useBranchAdmins";
import { useUnifiedCreateThread } from "@/hooks/useUnifiedMessaging";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import { ClientMessageList } from "@/components/client/ClientMessageList";
import { ClientMessageView } from "@/components/client/ClientMessageView";
import { ClientMessageComposer } from "@/components/client/ClientMessageComposer";
const formSchema = z.object({
  subject: z.string({
    required_error: "Please select a subject"
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters."
  }),
  priority: z.string().optional()
});
type FormValues = z.infer<typeof formSchema>;
const ClientSupport = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("send-message");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const { toast } = useToast();
  const { navigateToClientPage } = useClientNavigation();
  
  // Get authenticated client data
  const { data: authData, isLoading: authLoading, error: authError } = useSimpleClientAuth();
  const clientId = authData?.client?.id;
  const branchId = authData?.client?.branch_id;
  
  // Get branch admins for the client's branch
  const { data: branchAdmins = [], isLoading: adminsLoading } = useBranchAdmins(branchId || '');
  
  // Hook to create message threads
  const createThread = useUnifiedCreateThread();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      message: "",
      priority: "normal"
    }
  });

  const onSubmit = async (data: FormValues) => {
    if (!clientId || !branchId || branchAdmins.length === 0) {
      toast({
        title: "Error",
        description: "Unable to send message. Please try refreshing the page.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Map subject values to readable titles
      const subjectMapping: Record<string, string> = {
        general: "General Inquiry",
        billing: "Billing Question", 
        service: "Service Feedback",
        technical: "Technical Support",
        other: "Other"
      };

      const subject = `Support - ${subjectMapping[data.subject] || data.subject}`;
      
      // Prepare recipient data (all branch admins)
      const recipientIds = branchAdmins.map(admin => admin.id);
      const recipientNames = branchAdmins.map(admin => `${admin.first_name} ${admin.last_name}`);
      const recipientTypes = branchAdmins.map(() => 'branch_admin');

      // Create message thread
      const result = await createThread.mutateAsync({
        recipientIds,
        recipientNames,
        recipientTypes,
        subject,
        initialMessage: data.message,
        threadType: 'support',
        messageType: 'support',
        priority: data.priority || 'normal',
        actionRequired: data.priority === 'high'
      });

      toast({
        title: "Message sent successfully",
        description: "Your support request has been sent to the admin team.",
        action: (
          <Button
            size="sm"
            onClick={() => navigateToClientPage('/messages')}
            className="ml-2"
          >
            Open Messages
          </Button>
        )
      });
      
      form.reset();
      
      // Switch to responses tab to show the new conversation
      setActiveTab("responses");
    } catch (error) {
      console.error('Failed to send support message:', error);
      toast({
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Message handling functions
  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
    setShowComposer(false);
  };

  const handleSendMessage = () => {
    setShowComposer(false);
    // Refresh by clearing and resetting selected message
    const currentMessage = selectedMessageId;
    setSelectedMessageId(null);
    setTimeout(() => setSelectedMessageId(currentMessage), 100);
  };
  return (
    <div className="space-y-6">
      {/* Contact Information Card */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center">
            <HelpCircle className="mr-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            Help & Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-foreground">Contact Us</h3>
              <p className="text-muted-foreground mb-4">
                Our support team is here to help you with any questions or issues you may have.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-foreground">Email Support</p>
                    <a href="mailto:support@med-infinite.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                      support@med-infinite.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-foreground">Phone Support</p>
                    <a href="tel:+18005551234" className="text-blue-600 dark:text-blue-400 hover:underline">+44 (800) 555-1234</a>
                    <p className="text-sm text-muted-foreground">Mon-Fri: 9am - 5pm</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 className="text-lg font-medium mb-2 text-foreground">Support Hours</h3>
              <ul className="space-y-2 text-foreground">
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
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Emergency support available 24/7 for urgent medical matters.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Messages Tabs */}
      <Card className="border border-border">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="send-message">Send Message</TabsTrigger>
                <TabsTrigger value="responses">My Support Requests</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="send-message" className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Send Us a Message</h3>
                <p className="text-muted-foreground mb-6">
                  Submit a support request and we'll get back to you as soon as possible.
                </p>
              </div>

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
                    <Button
                      type="submit"
                      disabled={isSubmitting || authLoading || adminsLoading || !clientId || !branchId || branchAdmins.length === 0}
                    >
                      {isSubmitting ? "Sending..." : 
                       authLoading ? "Loading..." :
                       adminsLoading ? "Loading contacts..." :
                       !clientId ? "Authentication required" :
                       branchAdmins.length === 0 ? "No admins available" :
                       "Send Message"}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="responses" className="p-0">
              <div className="h-[600px] flex">
                {/* Message List */}
                <div className="w-1/2 border-r border-border">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Support Conversations</h3>
                    <p className="text-sm text-muted-foreground">View and respond to your support requests</p>
                  </div>
                  <ClientMessageList
                    selectedContactId={null}
                    selectedMessageId={selectedMessageId}
                    onMessageSelect={handleMessageSelect}
                    onComposeClick={() => setActiveTab("send-message")}
                    searchTerm="Support -"
                  />
                </div>

                {/* Message View or Composer */}
                <div className="w-1/2">
                  {showComposer ? (
                    <ClientMessageComposer
                      selectedContactId={null}
                      selectedThreadId={null}
                      onClose={() => setShowComposer(false)}
                      onSend={handleSendMessage}
                    />
                  ) : selectedMessageId ? (
                    <ClientMessageView
                      messageId={selectedMessageId}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-muted/30">
                      <div className="text-muted-foreground text-lg mb-2">No conversation selected</div>
                      <p className="text-sm text-muted-foreground max-w-md text-center">
                        Select a support conversation from the list to view messages and responses.
                      </p>
                      <Button
                        onClick={() => setActiveTab("send-message")}
                        className="mt-4"
                        variant="outline"
                      >
                        Send New Support Message
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="font-medium mb-2 text-foreground">How do I reschedule an appointment?</h3>
              <p className="text-muted-foreground">
                You can reschedule an appointment by going to the Appointments section, finding your scheduled 
                appointment, and clicking the "Reschedule" button. Appointments can be rescheduled up to 24 hours before
                the scheduled time.
              </p>
            </div>
            
            <div className="border-b border-border pb-3">
              <h3 className="font-medium mb-2 text-foreground">How do I update my personal information?</h3>
              <p className="text-muted-foreground">
                To update your personal information, navigate to the Profile section in your dashboard. 
                There you can edit your contact details, address, and other personal information.
              </p>
            </div>
            
            <div className="border-b border-border pb-3">
              <h3 className="font-medium mb-2 text-foreground">Where can I find my care plan documents?</h3>
              <p className="text-muted-foreground">
                Your care plan documents can be found in the "Care Plans" section of your dashboard. 
                You can view, download, and print these documents as needed.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 text-foreground">How do I pay my bill online?</h3>
              <p className="text-muted-foreground">
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
