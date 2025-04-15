
import React, { useState } from 'react';
import { Form } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings2, Code, Lock, Timer, PersonStanding, Mail, MessageSquare, 
  FileJson, Database, Layout, ScrollText, Link2, Workflow
} from 'lucide-react';

interface FormAdvancedTabProps {
  form: Form;
  onFormChange: (updatedForm: Form) => void;
}

export const FormAdvancedTab: React.FC<FormAdvancedTabProps> = ({ 
  form,
  onFormChange
}) => {
  const [activeTab, setActiveTab] = useState<string>('permissions');

  const handleSettingChange = (key: string, value: any) => {
    onFormChange({
      ...form,
      settings: {
        ...(form.settings || {}),
        [key]: value
      }
    });
  };

  const updateFormPermissions = (permissions: any) => {
    onFormChange({
      ...form,
      permissions
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-bold">Advanced Settings</h2>
          <p className="text-muted-foreground">Configure advanced options for your form</p>
        </div>
        <Settings2 className="text-gray-400 h-6 w-6" />
      </div>
      
      <Tabs defaultValue="permissions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="permissions">
            <Lock className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <MessageSquare className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <Workflow className="h-4 w-4 mr-2" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Database className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="permissions" className="bg-white border rounded-md p-6 mt-4">
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Access Control</h3>
              <p className="text-sm text-muted-foreground">
                Control who can view, fill out, and manage this form
              </p>
            </div>

            <Separator />
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* View Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">View Permissions</CardTitle>
                    <CardDescription>Who can view this form</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="view-clients" 
                          checked={(form.permissions?.view?.clients || false)}
                          onCheckedChange={(checked) => {
                            updateFormPermissions({
                              ...(form.permissions || {}),
                              view: {
                                ...(form.permissions?.view || {}),
                                clients: !!checked
                              }
                            });
                          }}
                        />
                        <Label htmlFor="view-clients">Clients</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="view-staff" 
                          checked={(form.permissions?.view?.staff || false)}
                          onCheckedChange={(checked) => {
                            updateFormPermissions({
                              ...(form.permissions || {}),
                              view: {
                                ...(form.permissions?.view || {}),
                                staff: !!checked
                              }
                            });
                          }}
                        />
                        <Label htmlFor="view-staff">Staff</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="view-carers" 
                          checked={(form.permissions?.view?.carers || false)}
                          onCheckedChange={(checked) => {
                            updateFormPermissions({
                              ...(form.permissions || {}),
                              view: {
                                ...(form.permissions?.view || {}),
                                carers: !!checked
                              }
                            });
                          }}
                        />
                        <Label htmlFor="view-carers">Carers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="view-admins" 
                          checked={(form.permissions?.view?.admins || true)}
                          onCheckedChange={(checked) => {
                            updateFormPermissions({
                              ...(form.permissions || {}),
                              view: {
                                ...(form.permissions?.view || {}),
                                admins: !!checked
                              }
                            });
                          }}
                        />
                        <Label htmlFor="view-admins">Admins</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Submit Permissions</CardTitle>
                    <CardDescription>Who can fill out and submit this form</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="submit-clients" 
                          checked={(form.permissions?.submit?.clients || false)}
                          onCheckedChange={(checked) => {
                            updateFormPermissions({
                              ...(form.permissions || {}),
                              submit: {
                                ...(form.permissions?.submit || {}),
                                clients: !!checked
                              }
                            });
                          }}
                        />
                        <Label htmlFor="submit-clients">Clients</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="submit-staff" 
                          checked={(form.permissions?.submit?.staff || false)}
                          onCheckedChange={(checked) => {
                            updateFormPermissions({
                              ...(form.permissions || {}),
                              submit: {
                                ...(form.permissions?.submit || {}),
                                staff: !!checked
                              }
                            });
                          }}
                        />
                        <Label htmlFor="submit-staff">Staff</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="submit-carers" 
                          checked={(form.permissions?.submit?.carers || false)}
                          onCheckedChange={(checked) => {
                            updateFormPermissions({
                              ...(form.permissions || {}),
                              submit: {
                                ...(form.permissions?.submit || {}),
                                carers: !!checked
                              }
                            });
                          }}
                        />
                        <Label htmlFor="submit-carers">Carers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="submit-admins" 
                          checked={(form.permissions?.submit?.admins || true)}
                          onCheckedChange={(checked) => {
                            updateFormPermissions({
                              ...(form.permissions || {}),
                              submit: {
                                ...(form.permissions?.submit || {}),
                                admins: !!checked
                              }
                            });
                          }}
                        />
                        <Label htmlFor="submit-admins">Admins</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require users to login before viewing or submitting</p>
                    </div>
                    <Switch 
                      checked={(form.settings?.requireAuth || false)}
                      onCheckedChange={(checked) => handleSettingChange('requireAuth', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Record IP Address</Label>
                      <p className="text-sm text-muted-foreground">Save IP address with form submissions</p>
                    </div>
                    <Switch 
                      checked={(form.settings?.recordIP || false)}
                      onCheckedChange={(checked) => handleSettingChange('recordIP', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="bg-white border rounded-md p-6 mt-4">
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Notification Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure who receives notifications when forms are submitted
              </p>
            </div>

            <Separator />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Notifications</CardTitle>
                <CardDescription>Send email notifications when forms are submitted</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Email Notifications</Label>
                  </div>
                  <Switch 
                    checked={(form.settings?.notifications?.email?.enabled || false)}
                    onCheckedChange={(checked) => {
                      handleSettingChange('notifications', {
                        ...(form.settings?.notifications || {}),
                        email: {
                          ...(form.settings?.notifications?.email || {}),
                          enabled: checked
                        }
                      });
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Textarea 
                    placeholder="Enter email addresses, separated by commas"
                    value={form.settings?.notifications?.email?.recipients || ""}
                    onChange={(e) => {
                      handleSettingChange('notifications', {
                        ...(form.settings?.notifications || {}),
                        email: {
                          ...(form.settings?.notifications?.email || {}),
                          recipients: e.target.value
                        }
                      });
                    }}
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input 
                    placeholder="New form submission: {{form_title}}"
                    value={form.settings?.notifications?.email?.subject || ""}
                    onChange={(e) => {
                      handleSettingChange('notifications', {
                        ...(form.settings?.notifications || {}),
                        email: {
                          ...(form.settings?.notifications?.email || {}),
                          subject: e.target.value
                        }
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="workflow" className="bg-white border rounded-md p-6 mt-4">
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Workflow Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure form workflow and review process
              </p>
            </div>

            <Separator />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review Process</CardTitle>
                <CardDescription>Configure approval workflow for form submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Review Workflow</Label>
                    <p className="text-sm text-muted-foreground">Submissions will require review before being finalized</p>
                  </div>
                  <Switch 
                    checked={form.requiresReview}
                    onCheckedChange={(checked) => {
                      onFormChange({
                        ...form,
                        requiresReview: checked
                      });
                    }}
                  />
                </div>
                
                {form.requiresReview && (
                  <>
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Reviewers</Label>
                      <Select
                        value={(form.settings?.workflow?.reviewerType || "admin")}
                        onValueChange={(value) => {
                          handleSettingChange('workflow', {
                            ...(form.settings?.workflow || {}),
                            reviewerType: value
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select reviewer type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Branch Admin</SelectItem>
                          <SelectItem value="manager">Branch Manager</SelectItem>
                          <SelectItem value="specific">Specific Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(form.settings?.workflow?.reviewerType === 'specific') && (
                      <div className="space-y-2">
                        <Label>Specific Reviewers</Label>
                        <Textarea
                          placeholder="Enter email addresses of reviewers, separated by commas"
                          value={(form.settings?.workflow?.specificReviewers || "")}
                          onChange={(e) => {
                            handleSettingChange('workflow', {
                              ...(form.settings?.workflow || {}),
                              specificReviewers: e.target.value
                            });
                          }}
                          rows={2}
                        />
                      </div>
                    )}
                  </>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>After Submission</Label>
                  <Select
                    value={(form.settings?.workflow?.afterSubmission || "thankyou")}
                    onValueChange={(value) => {
                      handleSettingChange('workflow', {
                        ...(form.settings?.workflow || {}),
                        afterSubmission: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select action after submission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thankyou">Show Thank You Message</SelectItem>
                      <SelectItem value="redirect">Redirect to URL</SelectItem>
                      <SelectItem value="another">Show Another Form</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(form.settings?.workflow?.afterSubmission === 'redirect') && (
                  <div className="space-y-2">
                    <Label>Redirect URL</Label>
                    <Input
                      placeholder="https://example.com/thank-you"
                      value={(form.settings?.workflow?.redirectUrl || "")}
                      onChange={(e) => {
                        handleSettingChange('workflow', {
                          ...(form.settings?.workflow || {}),
                          redirectUrl: e.target.value
                        });
                      }}
                    />
                  </div>
                )}
                
                {(form.settings?.workflow?.afterSubmission === 'thankyou') && (
                  <div className="space-y-2">
                    <Label>Thank You Message</Label>
                    <Textarea
                      placeholder="Thank you for your submission. We'll be in touch soon."
                      value={(form.settings?.workflow?.thankYouMessage || "")}
                      onChange={(e) => {
                        handleSettingChange('workflow', {
                          ...(form.settings?.workflow || {}),
                          thankYouMessage: e.target.value
                        });
                      }}
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="integrations" className="bg-white border rounded-md p-6 mt-4">
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Integrations</h3>
              <p className="text-sm text-muted-foreground">
                Connect this form to other systems and services
              </p>
            </div>

            <Separator />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Storage</CardTitle>
                <CardDescription>Configure where form data is stored</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="store-database" 
                    checked={(form.settings?.storage?.database || true)}
                    onCheckedChange={(checked) => {
                      handleSettingChange('storage', {
                        ...(form.settings?.storage || {}),
                        database: !!checked
                      });
                    }}
                  />
                  <Label htmlFor="store-database">Store in Database</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="store-file" 
                    checked={(form.settings?.storage?.file || false)}
                    onCheckedChange={(checked) => {
                      handleSettingChange('storage', {
                        ...(form.settings?.storage || {}),
                        file: !!checked
                      });
                    }}
                  />
                  <Label htmlFor="store-file">Export to File</Label>
                </div>
                
                {(form.settings?.storage?.file) && (
                  <div className="pl-6 space-y-4">
                    <div className="space-y-2">
                      <Label>File Format</Label>
                      <Select
                        value={(form.settings?.storage?.fileFormat || "csv")}
                        onValueChange={(value) => {
                          handleSettingChange('storage', {
                            ...(form.settings?.storage || {}),
                            fileFormat: value
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select file format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
