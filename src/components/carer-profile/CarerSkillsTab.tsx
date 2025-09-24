import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Award, Plus, Star, TrendingUp, Search, Edit } from "lucide-react";

interface CarerSkillsTabProps {
  carerId: string;
}

export const CarerSkillsTab: React.FC<CarerSkillsTabProps> = ({ carerId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddSkill, setShowAddSkill] = useState(false);

  const skillCategories = [
    {
      category: "Clinical Skills",
      skills: [
        { name: "Medication Administration", level: 4, verified: true, lastAssessed: "2023-12-01" },
        { name: "Vital Signs Monitoring", level: 5, verified: true, lastAssessed: "2023-11-15" },
        { name: "First Aid & CPR", level: 4, verified: true, lastAssessed: "2023-10-20" },
        { name: "Wound Care", level: 3, verified: false, lastAssessed: "2023-09-10" },
        { name: "Catheter Care", level: 2, verified: false, lastAssessed: null }
      ]
    },
    {
      category: "Personal Care",
      skills: [
        { name: "Mobility Assistance", level: 5, verified: true, lastAssessed: "2023-12-05" },
        { name: "Personal Hygiene Support", level: 5, verified: true, lastAssessed: "2023-11-30" },
        { name: "Meal Preparation", level: 4, verified: true, lastAssessed: "2023-10-15" },
        { name: "Household Management", level: 3, verified: false, lastAssessed: "2023-08-20" }
      ]
    },
    {
      category: "Communication",
      skills: [
        { name: "Client Communication", level: 5, verified: true, lastAssessed: "2023-12-10" },
        { name: "Family Liaison", level: 4, verified: true, lastAssessed: "2023-11-25" },
        { name: "Documentation", level: 4, verified: true, lastAssessed: "2023-12-01" },
        { name: "Conflict Resolution", level: 3, verified: false, lastAssessed: "2023-09-05" }
      ]
    },
    {
      category: "Specialized Care",
      skills: [
        { name: "Dementia Care", level: 4, verified: true, lastAssessed: "2023-11-20" },
        { name: "Mental Health Support", level: 3, verified: false, lastAssessed: "2023-10-01" },
        { name: "End of Life Care", level: 2, verified: false, lastAssessed: null },
        { name: "Learning Disabilities", level: 3, verified: true, lastAssessed: "2023-09-15" }
      ]
    }
  ];

  const getSkillLevelColor = (level: number) => {
    switch (level) {
      case 5: return "text-green-600 bg-green-50";
      case 4: return "text-blue-600 bg-blue-50";
      case 3: return "text-yellow-600 bg-yellow-50";
      case 2: return "text-orange-600 bg-orange-50";
      case 1: return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getSkillLevelText = (level: number) => {
    switch (level) {
      case 5: return "Expert";
      case 4: return "Advanced";
      case 3: return "Intermediate";
      case 2: return "Basic";
      case 1: return "Beginner";
      default: return "Not Rated";
    }
  };

  const filteredCategories = skillCategories.map(category => ({
    ...category,
    skills: category.skills.filter(skill =>
      skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.skills.length > 0);

  const totalSkills = skillCategories.reduce((acc, cat) => acc + cat.skills.length, 0);
  const verifiedSkills = skillCategories.reduce((acc, cat) => 
    acc + cat.skills.filter(skill => skill.verified).length, 0
  );
  const averageLevel = skillCategories.reduce((acc, cat) => 
    acc + cat.skills.reduce((sum, skill) => sum + skill.level, 0), 0
  ) / totalSkills;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Skills Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalSkills}</div>
              <div className="text-sm text-muted-foreground">Total Skills</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{verifiedSkills}</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{averageLevel.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Level</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {Math.round((verifiedSkills / totalSkills) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Verified Rate</div>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowAddSkill(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredCategories.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle className="text-lg">{category.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {category.skills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getSkillLevelColor(skill.level)}`}>
                      <Award className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{skill.name}</h4>
                        {skill.verified && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Level:</span>
                          <div className="flex">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`h-3 w-3 ${star <= skill.level ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${getSkillLevelColor(skill.level)}`}>
                            {getSkillLevelText(skill.level)}
                          </span>
                        </div>
                        
                        {skill.lastAssessed && (
                          <span>Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    Update
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Skill Development Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Advanced Wound Care</h4>
                <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">Progress:</span>
                <Progress value={60} className="flex-1 h-2" />
                <span className="text-sm font-medium">60%</span>
              </div>
              <p className="text-sm text-muted-foreground">Target completion: March 2024</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Mental Health First Aid</h4>
                <Badge className="bg-green-100 text-green-800">Planned</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Training scheduled for April 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};