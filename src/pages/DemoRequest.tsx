import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DemoRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    organizationName: "",
    email: "",
    phoneNumber: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('demo_requests')
        .insert({
          full_name: formData.fullName,
          organization_name: formData.organizationName || null,
          email: formData.email,
          phone_number: formData.phoneNumber || null,
          message: formData.message || null
        });

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
      toast({
        title: "Demo request submitted successfully!",
        description: "We'll get back to you within 24 hours.",
      });

    } catch (error) {
      console.error('Error submitting demo request:', error);
      toast({
        title: "Error submitting request",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-900">Request Submitted!</h1>
              <p className="text-gray-600">
                Thank you for your interest in MED-INFINITE. Our team will review your request and get back to you within 24 hours.
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Demo</h1>
            <p className="text-gray-600">
              Get a personalized demonstration of MED-INFINITE and see how it can transform your healthcare operations.
            </p>
          </div>
        </div>

        {/* Demo Request Form */}
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your organisation</CardTitle>
            <CardDescription>
              Fill out the form below and our team will schedule a personalized demo for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organisation Name</Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    placeholder="Enter your organisation name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us about your specific needs or questions about MED-INFINITE..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            By submitting this form, you agree to be contacted by our team regarding your demo request.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoRequest;