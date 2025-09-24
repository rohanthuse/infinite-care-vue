import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, Save, X, Plus, Star } from "lucide-react";

interface CarerSupportingStatementTabProps {
  carerId: string;
}

export const CarerSupportingStatementTab: React.FC<CarerSupportingStatementTabProps> = ({ carerId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [statement, setStatement] = useState(`I am a dedicated healthcare professional with over 5 years of experience in providing compassionate care to elderly and vulnerable adults. My approach to care is person-centered, ensuring that each individual's dignity, independence, and wellbeing are at the forefront of everything I do.

Throughout my career, I have developed strong skills in:
- Personal care and daily living support
- Medication administration and monitoring
- Emergency response and crisis management
- Building meaningful relationships with clients and families
- Maintaining accurate care documentation

I am committed to continuous professional development and stay updated with best practices in care delivery. My goal is to make a positive difference in the lives of those I care for, promoting their independence while ensuring their safety and comfort.`);

  const references = [
    {
      id: 1,
      name: 'Sarah Wilson',
      position: 'Care Manager',
      company: 'Sunrise Care Services',
      relationship: 'Direct Supervisor',
      contactDate: '2023-12-01',
      rating: 5,
      statement: 'Outstanding care worker with exceptional dedication to client wellbeing. Consistently demonstrates professionalism and compassion.'
    },
    {
      id: 2,
      name: 'Dr. Michael Brown',
      position: 'Clinical Director',
      company: 'NHS Trust Hospital',
      relationship: 'Clinical Supervisor',
      contactDate: '2023-11-15',
      rating: 5,
      statement: 'Reliable and skilled healthcare professional. Shows excellent clinical judgment and communication skills.'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Personal Statement
          </CardTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={() => setIsEditing(false)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={12}
              className="resize-none"
              placeholder="Write your personal statement here..."
            />
          ) : (
            <div className="prose max-w-none">
              {statement.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3 text-sm leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Professional References
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Reference
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {references.map((reference) => (
              <Card key={reference.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{reference.name}</h4>
                    <p className="text-sm text-muted-foreground">{reference.position}</p>
                    <p className="text-sm text-muted-foreground">{reference.company}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`h-3 w-3 ${star <= reference.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <Badge variant="outline">{reference.relationship}</Badge>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm italic">"{reference.statement}"</p>
                </div>
                
                <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                  <span>Reference obtained: {new Date(reference.contactDate).toLocaleDateString()}</span>
                  <Button size="sm" variant="outline">Contact Reference</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Career Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <div>
                <p className="font-medium">Employee of the Month Award</p>
                <p className="text-sm text-muted-foreground">Recognized for exceptional client care - December 2023</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full" />
              <div>
                <p className="font-medium">Perfect Attendance Record</p>
                <p className="text-sm text-muted-foreground">12 months without absence - 2023</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="h-2 w-2 bg-purple-500 rounded-full" />
              <div>
                <p className="font-medium">Advanced Dementia Care Certification</p>
                <p className="text-sm text-muted-foreground">Specialized training completed - August 2023</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};