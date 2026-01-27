import React, { useState, useEffect } from "react";
import { 
  X, Send, Clock, Save, BadgeCheck, Building2, 
  FileUp, Mail, Phone, User, Users, Bell, FileText
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { useUnifiedCreateThread, useUnifiedSendMessage } from "@/hooks/useUnifiedMessaging";
import { useAdminContacts } from "@/hooks/useAdminMessaging";
import { useFileUpload } from "@/hooks/useFileUpload";
import { supabase } from "@/integrations/supabase/client";
import { CommunicationTypeSelector } from "@/components/messaging/CommunicationTypeSelector";
import { ScheduleMessageDialog } from "./ScheduleMessageDialog";
import { MessageFollowUpSection } from "./MessageFollowUpSection";
import { useStaffList } from "@/hooks/useAccountingData";

interface ClientMessageRecipient {
  id: string;
  auth_user_id: string;
  name: string;
  avatar: string;
  type: 'branch_admin' | 'super_admin' | 'carer' | 'client';
  email?: string;
  canMessage: boolean;
  groupLabel: string;
}

interface MessageComposerProps {
  branchId: string;
  onClose: () => void;
  selectedContactId?: string | null;
  selectedThreadId?: string | null;
  clientId?: string | null;
  availableRecipients?: ClientMessageRecipient[];
  restrictToClientContext?: boolean;
  initialDraft?: any;
}

export const MessageComposer = ({ 
  branchId, 
  onClose,
  selectedContactId,
  selectedThreadId,
  clientId,
  availableRecipients,
  restrictToClientContext = false,
  initialDraft
}: MessageComposerProps) => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [files, setFiles] = useState<File[]>([]);
  const [messageType, setMessageType] = useState("");
  const [actionRequired, setActionRequired] = useState(false);
  const [adminEyesOnly, setAdminEyesOnly] = useState(false);
  const [notificationMethods, setNotificationMethods] = useState({
    email: false,
    mobileApp: false,
    otherEmail: false
  });
  const [otherEmailAddress, setOtherEmailAddress] = useState("");
  
  // Follow-up assignment fields
  const [followUpAssignedTo, setFollowUpAssignedTo] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [followUpNotes, setFollowUpNotes] = useState("");

  const [showContactSelector, setShowContactSelector] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<{
    carers: string[];
    clients: string[];
    admins: string[];
  }>({
    carers: [],
    clients: [],
    admins: []
  });

  const [fontFamily, setFontFamily] = useState("Sans Serif");
  const [fontSize, setFontSize] = useState("14px");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState("");

  const shouldUseClientRecipients = restrictToClientContext && availableRecipients;
  const { data: adminContacts = [], isLoading: contactsLoading, error: contactsError } = useAdminContacts(branchId);
  const availableContacts = shouldUseClientRecipients ? availableRecipients : adminContacts;
  
  // Get current user role to default adminEyesOnly for admins
  const { data: currentUser } = useUserRole();
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'branch_admin';
  
  // Filter contacts based on search term
  const filteredContacts = availableContacts.filter((contact: any) => 
    contact.name?.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );
  
  const createThread = useUnifiedCreateThread();
  const sendMessage = useUnifiedSendMessage();
  const { uploadFile, uploading: uploadingFiles } = useFileUpload();
  
  // Get staff list for follow-up assignment
  const { data: staffList = [], isLoading: isLoadingStaff } = useStaffList(branchId);
  
  const isReply = !!selectedThreadId;

  // Default adminEyesOnly to true for admin users (unless loading a draft)
  useEffect(() => {
    if (currentUser && !initialDraft) {
      const isAdminUser = currentUser.role === 'super_admin' || currentUser.role === 'branch_admin';
      setAdminEyesOnly(isAdminUser);
    }
  }, [currentUser?.role, initialDraft]);

  useEffect(() => {
    if (selectedContactId) {
      const contact = availableContacts.find(c => c.id === selectedContactId);
      if (contact) {
        if (contact.type === 'carer') {
          setSelectedContacts(prev => ({
            ...prev,
            carers: [selectedContactId]
          }));
        } else if (contact.type === 'client') {
          setSelectedContacts(prev => ({
            ...prev,
            clients: [selectedContactId]
          }));
        } else if (contact.type === 'branch_admin' || contact.type === 'super_admin') {
          setSelectedContacts(prev => ({
            ...prev,
            admins: [selectedContactId]
          }));
        }
        setRecipients([selectedContactId]);
      }
    }
  }, [selectedContactId, availableContacts]);

  // Pre-fill form fields when editing a draft
  useEffect(() => {
    if (initialDraft) {
      setSubject(initialDraft.subject || "");
      setContent(initialDraft.content || "");
      setMessageType(initialDraft.message_type || "");
      setPriority(initialDraft.priority || "medium");
      setActionRequired(initialDraft.action_required || false);
      setAdminEyesOnly(initialDraft.admin_eyes_only || false);
      setRecipients(initialDraft.recipient_ids || []);
      
      // Parse notification methods
      const methods = initialDraft.notification_methods || [];
      setNotificationMethods({
        email: methods.includes('email'),
        mobileApp: methods.includes('mobileApp'),
        otherEmail: methods.includes('otherEmail')
      });
      
      setOtherEmailAddress(initialDraft.other_email_address || "");
      
      // Set selected contacts based on recipient IDs and types
      const newSelectedContacts = {
        carers: [] as string[],
        clients: [] as string[],
        admins: [] as string[]
      };
      
      initialDraft.recipient_ids?.forEach((id: string, index: number) => {
        const type = initialDraft.recipient_types?.[index];
        if (type === 'carer') {
          newSelectedContacts.carers.push(id);
        } else if (type === 'client') {
          newSelectedContacts.clients.push(id);
        } else {
          newSelectedContacts.admins.push(id);
        }
      });
      
      setSelectedContacts(newSelectedContacts);
    }
  }, [initialDraft]);

  const handleContactToggle = (contactId: string, contactType: "carers" | "clients" | "admins") => {
    setSelectedContacts(prev => {
      const newSelected = { ...prev };
      if (newSelected[contactType].includes(contactId)) {
        newSelected[contactType] = newSelected[contactType].filter(id => id !== contactId);
      } else {
        newSelected[contactType] = [...newSelected[contactType], contactId];
      }
      
      // Immediately update recipients when contacts are toggled
      const allSelectedIds = [...newSelected.carers, ...newSelected.clients, ...newSelected.admins];
      setRecipients(allSelectedIds);
      
      return newSelected;
    });
  };

  const handleApplyContacts = () => {
    setShowContactSelector(false);
    setContactSearchTerm(""); // Clear search on close
  };

  const getContactDetails = (contactId: string) => {
    // In client context, recipients are stored as auth_user_id, so match by that first
    return availableContacts.find(c => {
      const recipientContact = c as ClientMessageRecipient;
      return (recipientContact.auth_user_id && recipientContact.auth_user_id === contactId) || c.id === contactId;
    });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendMessage = async () => {
    if (!messageType.trim()) {
      toast.error("Please select a message type");
      return;
    }
    
    if (!content.trim()) {
      toast.error("Please enter message details");
      return;
    }
    
    if (!isReply && recipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    // Validate other email if checkbox is checked
    if (notificationMethods.otherEmail) {
      if (!otherEmailAddress.trim()) {
        toast.error("Please enter an email address for 'Other Email Address'");
        return;
      }
      if (!validateEmail(otherEmailAddress)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }
    
    try {
      // Upload files if any
      let attachments: any[] = [];
      if (files.length > 0) {
        toast.info(`Uploading ${files.length} file(s)...`);
        for (const file of files) {
          try {
            const uploadedFile = await uploadFile(file, {
              category: 'attachment'
            });
            attachments.push({
              id: uploadedFile.id,
              name: uploadedFile.file_name,
              path: uploadedFile.storage_path,
              type: uploadedFile.file_type,
              size: uploadedFile.file_size,
              bucket: 'agreement-files'
            });
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            toast.error(`Failed to upload ${file.name}`);
            return;
          }
        }
        toast.success('Files uploaded successfully');
      }

      if (isReply && selectedThreadId) {
        // Send reply to existing thread
        await sendMessage.mutateAsync({
          threadId: selectedThreadId,
          content: content.trim(),
          messageType,
          priority,
          actionRequired,
          adminEyesOnly,
          attachments,
          notificationMethods: Object.entries(notificationMethods)
            .filter(([_, enabled]) => enabled)
            .map(([method, _]) => method),
          otherEmailAddress: notificationMethods.otherEmail ? otherEmailAddress.trim() : undefined,
          followUpAssignedTo: actionRequired ? followUpAssignedTo || undefined : undefined,
          followUpDate: actionRequired && followUpDate ? format(followUpDate, 'yyyy-MM-dd') : undefined,
          followUpNotes: actionRequired ? followUpNotes || undefined : undefined
        });
      } else {
        // Create new thread - validate subject and recipients for new messages only
        if (!subject.trim()) {
          toast.error("Please enter a subject");
          return;
        }
        
        if (recipients.length === 0) {
          toast.error("Please select at least one recipient");
          return;
        }
        
        // Deduplicate recipients
        const uniqueRecipients = [...new Set(recipients)];
        
        // For Admin Eyes Only messages, allow ALL recipients (internal notes)
        // For standard messages, require auth accounts for delivery
        const messageableRecipients = uniqueRecipients.filter(id => {
          const contact = availableContacts.find(c => {
            const recipientContact = c as ClientMessageRecipient;
            return (recipientContact.auth_user_id && recipientContact.auth_user_id === id) || c.id === id;
          });
          // Admin-only messages can be saved against any client (internal notes)
          if (adminEyesOnly) {
            return true;
          }
          // Standard messages require auth account for delivery
          return contact?.canMessage !== false;
        });
        
        const skippedCount = uniqueRecipients.length - messageableRecipients.length;
        
        if (messageableRecipients.length === 0) {
          toast.error("No valid recipients selected. Recipients must have registered accounts to receive messages.");
          return;
        }
        
        // Show warning only for non-admin messages when recipients are skipped
        if (skippedCount > 0 && !adminEyesOnly) {
          toast.warning(`${skippedCount} recipient(s) skipped (account setup required). Sending to ${messageableRecipients.length} valid recipient(s).`);
        }
        
        // Check if any recipients lack auth accounts (for informational toast later)
        const hasUnregisteredRecipients = uniqueRecipients.some(id => {
          const contact = availableContacts.find(c => {
            const recipientContact = c as ClientMessageRecipient;
            return (recipientContact.auth_user_id && recipientContact.auth_user_id === id) || c.id === id;
          }) as any;
          return contact?.canMessage === false || contact?.hasAuthAccount === false;
        });
        
        const recipientData = messageableRecipients.map(recipientId => {
          const contact = availableContacts.find(c => {
            const recipientContact = c as ClientMessageRecipient;
            return (recipientContact.auth_user_id && recipientContact.auth_user_id === recipientId) || c.id === recipientId;
          }) as any;
          return {
            id: recipientId,
            name: contact?.name || 'Unknown',
            type: contact?.type || 'branch_admin',
            clientDbId: contact?.clientDbId || null,
            hasAuthAccount: contact?.hasAuthAccount ?? true
          };
        });

        await createThread.mutateAsync({
          recipientIds: recipientData.map(r => r.id),
          recipientNames: recipientData.map(r => r.name),
          recipientTypes: recipientData.map(r => r.type),
          subject: subject.trim(),
          initialMessage: content.trim(),
          threadType: messageType,
          requiresAction: actionRequired,
          adminOnly: adminEyesOnly,
          messageType,
          priority,
          actionRequired,
          adminEyesOnly,
          attachments,
          notificationMethods: Object.entries(notificationMethods)
            .filter(([_, enabled]) => enabled)
            .map(([method, _]) => method),
          otherEmailAddress: notificationMethods.otherEmail ? otherEmailAddress.trim() : undefined,
          followUpAssignedTo: actionRequired ? followUpAssignedTo || undefined : undefined,
          followUpDate: actionRequired && followUpDate ? format(followUpDate, 'yyyy-MM-dd') : undefined,
          followUpNotes: actionRequired ? followUpNotes || undefined : undefined
        });
        
        // Show informational toast for admin-only messages to unregistered clients
        if (adminEyesOnly && hasUnregisteredRecipients) {
          toast.info("Admin-only message saved internally – not delivered to client portal");
        }
      }
      
      // Reset form
      setContent("");
      setFiles([]);
      setOtherEmailAddress("");
      if (!isReply) {
        setSubject("");
        setRecipients([]);
        setSelectedContacts({ carers: [], clients: [], admins: [] });
        setMessageType("");
        setPriority("medium");
        setActionRequired(false);
        setAdminEyesOnly(false);
        setNotificationMethods({ email: false, mobileApp: false, otherEmail: false });
      }
      
      onClose();
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error(`Failed to send message: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSaveAsDraft = async () => {
    // Validation
    if (!content.trim()) {
      toast.error('Cannot save empty draft');
      return;
    }

    if (!isReply && recipients.length === 0) {
      toast.error('Please select at least one recipient before saving draft');
      return;
    }

    try {
      // Upload files if any
      let attachments: any[] = [];
      if (files.length > 0) {
        toast.info(`Uploading ${files.length} file(s)...`);
        for (const file of files) {
          const uploadedFile = await uploadFile(file, { category: 'attachment' });
          attachments.push({
            id: uploadedFile.id,
            name: uploadedFile.file_name,
            path: uploadedFile.storage_path,
            type: uploadedFile.file_type,
            size: uploadedFile.file_size,
            bucket: 'agreement-files'
          });
        }
      }

      const { data: currentUserData } = await supabase.auth.getUser();
      if (!currentUserData.user) throw new Error('Not authenticated');

      // Get recipient data
      const recipientData = recipients.map(recipientId => {
        const contact = getContactDetails(recipientId);
        return {
          id: recipientId,
          name: contact?.name || 'Unknown',
          type: contact?.type || 'branch_admin'
        };
      });

      // Save draft
      const { error: draftError } = await supabase
        .from('draft_messages')
        .insert({
          sender_id: currentUserData.user.id,
          thread_id: selectedThreadId || null,
          recipient_ids: recipientData.map(r => r.id),
          recipient_names: recipientData.map(r => r.name),
          recipient_types: recipientData.map(r => r.type),
          subject: subject.trim() || null,
          content: content.trim(),
          message_type: messageType,
          priority,
          action_required: actionRequired,
          admin_eyes_only: adminEyesOnly,
          attachments,
          notification_methods: Object.entries(notificationMethods)
            .filter(([_, enabled]) => enabled)
            .map(([method, _]) => method),
          other_email_address: notificationMethods.otherEmail ? otherEmailAddress.trim() : null,
          auto_saved: false
        });

      if (draftError) throw draftError;

      toast.success("Draft saved successfully");
      
      // Clear form
      setContent("");
      setFiles([]);
      setOtherEmailAddress("");
      if (!isReply) {
        setSubject("");
        setRecipients([]);
        setSelectedContacts({ carers: [], clients: [], admins: [] });
        setMessageType("");
        setPriority("medium");
        setActionRequired(false);
        setAdminEyesOnly(false);
        setNotificationMethods({ email: false, mobileApp: false, otherEmail: false });
      }
      
      onClose();
    } catch (error: any) {
      console.error('Save draft error:', error);
      toast.error(`Failed to save draft: ${error.message}`);
    }
  };

  const handleConfirmSchedule = async (scheduledDate: string, scheduledTime: string) => {
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
      toast.error('Scheduled time must be in the future');
      return;
    }
    
    if (!messageType.trim()) {
      toast.error('Please select a message type');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Please enter message content');
      return;
    }
    
    if (!isReply && recipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    
    try {
      let attachments: any[] = [];
      if (files.length > 0) {
        toast.info(`Uploading ${files.length} file(s)...`);
        for (const file of files) {
          const uploadedFile = await uploadFile(file, { category: 'attachment' });
          attachments.push({
            id: uploadedFile.id,
            name: uploadedFile.file_name,
            path: uploadedFile.storage_path,
            type: uploadedFile.file_type,
            size: uploadedFile.file_size,
            bucket: 'agreement-files'
          });
        }
      }
      
      const { data: currentUserData } = await supabase.auth.getUser();
      if (!currentUserData.user) throw new Error('Not authenticated');
      
      const { data: scheduledMessage, error: scheduleError } = await supabase
        .from('scheduled_messages')
        .insert({
          thread_id: selectedThreadId || null,
          sender_id: currentUserData.user.id,
          recipient_ids: recipients,
          subject: subject.trim() || null,
          content: content.trim(),
          message_type: messageType,
          priority,
          action_required: actionRequired,
          admin_eyes_only: adminEyesOnly,
          attachments,
          notification_methods: Object.entries(notificationMethods)
            .filter(([_, enabled]) => enabled)
            .map(([method, _]) => method),
          other_email_address: notificationMethods.otherEmail ? otherEmailAddress.trim() : null,
          scheduled_for: scheduledDateTime.toISOString(),
          status: 'pending'
        })
        .select()
        .single();
      
      if (scheduleError) throw scheduleError;
      
      const formattedDate = format(scheduledDateTime, 'PPp');
      toast.success(`Message scheduled successfully for ${formattedDate}`);
      
      setContent('');
      setFiles([]);
      if (!isReply) {
        setSubject('');
        setRecipients([]);
        setMessageType('');
      }
      
      onClose();
    } catch (error: any) {
      console.error('Schedule error:', error);
      toast.error(`Failed to schedule message: ${error.message}`);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      setFiles(Array.from(fileList));
      toast.success(`${fileList.length} file(s) selected`);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const fileList = event.dataTransfer.files;
    if (fileList) {
      setFiles(Array.from(fileList));
      toast.success(`${fileList.length} file(s) uploaded`);
    }
  };

  const isLoading = createThread.isPending || sendMessage.isPending || uploadingFiles;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {initialDraft ? "Edit Draft" : isReply ? "Reply to Message" : "New Message"}
          </h2>
          {adminEyesOnly && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              Admin Eyes Only
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="type" className="block text-sm font-medium mb-1">Type *</Label>
            <CommunicationTypeSelector
              value={messageType}
              onValueChange={setMessageType}
              placeholder="Select communication type"
            />
          </div>

          {!isReply && (
            <>
              <div>
                <Label className="block text-sm font-medium mb-2">Recipients *</Label>
                <div className="space-y-2">
                  {recipients.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recipients.map(recipientId => {
                        const contact = getContactDetails(recipientId);
                        return contact ? (
                          <Badge key={recipientId} variant="secondary" className="flex items-center gap-1">
                            {contact.name}
                            <button
                              onClick={() => setRecipients(prev => prev.filter(id => id !== recipientId))}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recipients selected</p>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowContactSelector(!showContactSelector)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {showContactSelector ? "Hide Contacts" : `Select Recipients ${recipients.length > 0 ? `(${recipients.length} selected)` : ""}`}
                  </Button>
                  
                  {showContactSelector && (
                    <div className="border rounded-md p-3 space-y-3 max-h-64 overflow-y-auto">
                      {/* Search Input */}
                      <div className="sticky top-0 bg-white pb-2 border-b">
                        <Input
                          placeholder="Search clients, carers, administrators..."
                          value={contactSearchTerm}
                          onChange={(e) => setContactSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      
                      {contactsError ? (
                        <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                          Error loading contacts: {contactsError.message}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="ml-2"
                            onClick={() => window.location.reload()}
                          >
                            Retry
                          </Button>
                        </div>
                      ) : contactsLoading ? (
                        <div className="text-gray-500 text-sm p-2">Loading contacts...</div>
                      ) : filteredContacts.length > 0 ? (
                        <>
                          {shouldUseClientRecipients ? (
                            // Client-specific recipient grouping
                            <>
                              {filteredContacts.filter((c: any) => c.groupLabel === 'Assigned Carers').length > 0 && (
                                <div>
                                  <Label className="text-sm font-semibold text-blue-700">
                                    👤 Assigned Carers
                                  </Label>
                                  <div className="space-y-1 mt-1">
                                    {filteredContacts.filter((c: any) => c.groupLabel === 'Assigned Carers').map((contact: any) => (
                                      <div key={contact.auth_user_id} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={recipients.includes(contact.auth_user_id)}
                                          onCheckedChange={() => {
                                            setRecipients(prev => 
                                              prev.includes(contact.auth_user_id)
                                                ? prev.filter(id => id !== contact.auth_user_id)
                                                : [...prev, contact.auth_user_id]
                                            );
                                          }}
                                        />
                                        <Label className="text-sm">{contact.name}</Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {filteredContacts.filter((c: any) => c.groupLabel === 'Branch Admins').length > 0 && (
                                <div>
                                  <Label className="text-sm font-semibold text-purple-700">
                                    🏢 Branch Admins
                                  </Label>
                                  <div className="space-y-1 mt-1">
                                    {filteredContacts.filter((c: any) => c.groupLabel === 'Branch Admins').map((contact: any) => (
                                      <div key={contact.auth_user_id} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={recipients.includes(contact.auth_user_id)}
                                          onCheckedChange={() => {
                                            setRecipients(prev => 
                                              prev.includes(contact.auth_user_id)
                                                ? prev.filter(id => id !== contact.auth_user_id)
                                                : [...prev, contact.auth_user_id]
                                            );
                                          }}
                                        />
                                        <Label className="text-sm">{contact.name}</Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {filteredContacts.filter((c: any) => c.groupLabel === 'Super Admins').length > 0 && (
                                <div>
                                  <Label className="text-sm font-semibold text-orange-700">
                                    ⭐ Super Admins
                                  </Label>
                                  <div className="space-y-1 mt-1">
                                    {filteredContacts.filter((c: any) => c.groupLabel === 'Super Admins').map((contact: any) => (
                                      <div key={contact.auth_user_id} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={recipients.includes(contact.auth_user_id)}
                                          onCheckedChange={() => {
                                            setRecipients(prev => 
                                              prev.includes(contact.auth_user_id)
                                                ? prev.filter(id => id !== contact.auth_user_id)
                                                : [...prev, contact.auth_user_id]
                                            );
                                          }}
                                        />
                                        <Label className="text-sm">{contact.name}</Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            // Original grouping for non-client context
                            <>
                              {filteredContacts.filter((c: any) => c.type === 'client').length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">Clients</Label>
                                  <div className="space-y-1 mt-1">
                                    {filteredContacts.filter((c: any) => c.type === 'client').map((contact: any) => (
                                      <div key={contact.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={selectedContacts.clients.includes(contact.id)}
                                          onCheckedChange={() => handleContactToggle(contact.id, 'clients')}
                                        />
                                        <Label className="text-sm flex items-center gap-2">
                                          {contact.name}
                                          {contact.canMessage === false && (
                                            <Badge variant="outline" className="px-1.5 py-0 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                              Setup Required
                                            </Badge>
                                          )}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {filteredContacts.filter((c: any) => c.type === 'carer').length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">Carers</Label>
                                  <div className="space-y-1 mt-1">
                                    {filteredContacts.filter((c: any) => c.type === 'carer').map((contact: any) => (
                                      <div key={contact.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={selectedContacts.carers.includes(contact.id)}
                                          onCheckedChange={() => handleContactToggle(contact.id, 'carers')}
                                        />
                                        <Label className="text-sm flex items-center gap-2">
                                          {contact.name}
                                          {contact.canMessage === false && (
                                            <Badge variant="outline" className="px-1.5 py-0 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                              Setup Required
                                            </Badge>
                                          )}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                             
                             {filteredContacts.filter((c: any) => c.type === 'branch_admin' || c.type === 'super_admin').length > 0 && (
                               <div>
                                 <Label className="text-sm font-medium">Administrators</Label>
                                 <div className="space-y-1 mt-1">
                                   {filteredContacts.filter((c: any) => c.type === 'branch_admin' || c.type === 'super_admin').map((contact: any) => (
                                     <div key={contact.id} className="flex items-center space-x-2">
                                       <Checkbox
                                         checked={selectedContacts.admins.includes(contact.id)}
                                         onCheckedChange={() => handleContactToggle(contact.id, 'admins')}
                                       />
                                       <Label className="text-sm">{contact.name}</Label>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                            </>
                          )}
                          
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-gray-500">
                              {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} selected
                            </span>
                            <Button size="sm" onClick={handleApplyContacts}>
                              Done
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 p-2">
                          No contacts available. 
                          {contactsError && (
                            <button 
                              onClick={() => window.location.reload()}
                              className="ml-1 text-blue-600 underline"
                            >
                              Refresh to try again
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="subject" className="block text-sm font-medium mb-1">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={messageType === "incident" ? "Incident Report - Brief Description" : "Enter subject"}
                  className="w-full"
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="content" className="block text-sm font-medium mb-1">Message *</Label>
            <div className="mb-2 flex items-center gap-2 border border-gray-200 p-2 rounded-t-md bg-gray-50">
              <select 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option>Sans Serif</option>
                <option>Serif</option>
                <option>Monospace</option>
              </select>

              <select 
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="px-2 py-1 border rounded w-20"
              >
                {[12, 14, 16, 18, 20].map(size => (
                  <option key={size}>{size}px</option>
                ))}
              </select>

              <Button
                variant="ghost"
                size="sm"
                className={cn("px-2", isBold && "bg-gray-200")}
                onClick={() => setIsBold(!isBold)}
              >
                B
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn("px-2", isItalic && "bg-gray-200")}
                onClick={() => setIsItalic(!isItalic)}
              >
                I
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn("px-2", isUnderline && "bg-gray-200")}
                onClick={() => setIsUnderline(!isUnderline)}
              >
                U
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={messageType === "incident" ? 
                "Please provide:\n- Detailed description of the incident\n- Time and date\n- People involved\n- Actions taken\n- Resolution\n- Next steps" : 
                "Type your message here..."
              }
              className={cn(
                "min-h-[200px]",
                "font-[" + fontFamily + "]",
                "text-[" + fontSize + "]",
                isBold && "font-bold",
                isItalic && "italic",
                isUnderline && "underline"
              )}
            />
          </div>

          <div>
            <Label className="block text-sm font-medium mb-1">Attachments</Label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md p-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-1 text-sm text-gray-600">
                  Drop files here to upload or
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <span>Select files...</span>
                  </Button>
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{files.length} file(s) selected</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="actionRequired"
                checked={actionRequired}
                onCheckedChange={(checked) => {
                  setActionRequired(checked as boolean);
                  // Clear follow-up fields when unchecked
                  if (!checked) {
                    setFollowUpAssignedTo("");
                    setFollowUpDate(undefined);
                    setFollowUpNotes("");
                  }
                }}
              />
              <Label htmlFor="actionRequired">Action Required?</Label>
            </div>
            
            {/* Follow-up Assignment Section - shown when Action Required is checked */}
            {actionRequired && (
              <MessageFollowUpSection
                followUpAssignedTo={followUpAssignedTo}
                followUpDate={followUpDate}
                followUpNotes={followUpNotes}
                onAssignedToChange={setFollowUpAssignedTo}
                onDateChange={setFollowUpDate}
                onNotesChange={setFollowUpNotes}
                staffList={staffList}
                isLoadingStaff={isLoadingStaff}
              />
            )}

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="adminEyesOnly"
                checked={adminEyesOnly}
                onCheckedChange={(checked) => setAdminEyesOnly(checked as boolean)}
              />
              <Label htmlFor="adminEyesOnly">Admin Eyes Only</Label>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">Send Notification By:</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="emailNotif"
                  checked={notificationMethods.email}
                  onCheckedChange={(checked) => 
                    setNotificationMethods(prev => ({ ...prev, email: checked as boolean }))
                  }
                />
                <Label htmlFor="emailNotif" className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mobileNotif"
                  checked={notificationMethods.mobileApp}
                  onCheckedChange={(checked) => {
                    setNotificationMethods(prev => ({ ...prev, mobileApp: checked as boolean }));
                    // Show toast when Mobile App is selected
                    if (checked) {
                      toast.info("This feature is not implemented yet.");
                    }
                  }}
                />
                <Label htmlFor="mobileNotif" className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Mobile App
                </Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="otherEmailNotif"
                    checked={notificationMethods.otherEmail}
                    onCheckedChange={(checked) => {
                      setNotificationMethods(prev => ({ ...prev, otherEmail: checked as boolean }));
                      if (!checked) {
                        setOtherEmailAddress("");
                      }
                    }}
                  />
                  <Label htmlFor="otherEmailNotif" className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Other Email Address
                  </Label>
                </div>
                
                {notificationMethods.otherEmail && (
                  <div className="ml-6 space-y-1">
                    <Input
                      type="email"
                      placeholder="Enter email address..."
                      value={otherEmailAddress}
                      onChange={(e) => setOtherEmailAddress(e.target.value)}
                      className={cn(
                        "w-full",
                        otherEmailAddress && !validateEmail(otherEmailAddress) && "border-red-500"
                      )}
                    />
                    {otherEmailAddress && !validateEmail(otherEmailAddress) && (
                      <p className="text-xs text-red-600">Please enter a valid email address</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSaveAsDraft}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowScheduleDialog(true)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button 
              size="sm"
              onClick={handleSendMessage}
              disabled={
                isLoading || 
                !content.trim() || 
                !messageType.trim() ||
                (!isReply && (!subject.trim() || recipients.length === 0))
              }
            >
              {isLoading ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
      </div>

      <ScheduleMessageDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onConfirm={handleConfirmSchedule}
      />
    </div>
  );
};
