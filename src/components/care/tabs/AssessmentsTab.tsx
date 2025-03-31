
import React from "react";
import { format } from "date-fns";
import { FileCheck, Calendar, User, ChevronDown, ChevronRight, CheckCircle, AlertCircle, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Assessment {
  name: string;
  date: Date;
  status: string;
  performer: string;
  results: string;
}

interface AssessmentsTabProps {
  assessments: Assessment[];
}

export const AssessmentsTab: React.FC<AssessmentsTabProps> = ({ assessments }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Assessments</CardTitle>
            </div>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Assessment</span>
            </Button>
          </div>
          <CardDescription>Evaluation records and findings</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {assessments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No assessments available</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {assessments.map((assessment, index) => (
                <AccordionItem key={index} value={`assessment-${index}`} className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="hover:no-underline px-4 py-3 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-1 items-center">
                      <div className="mr-3 p-2 rounded-full bg-blue-100">
                        <FileCheck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-left">{assessment.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(assessment.date, 'MMM dd, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {assessment.performer}
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${
                          assessment.status === "Completed" 
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        } ml-2`}
                      >
                        {assessment.status}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-white">
                    <div className="space-y-2">
                      <div className="border-l-4 border-blue-200 pl-3 py-1">
                        <h4 className="font-medium text-sm">Results</h4>
                        <p className="text-sm text-gray-700 mt-1">{assessment.results}</p>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm">View Full Report</Button>
                        <Button size="sm">Add Follow-up</Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
