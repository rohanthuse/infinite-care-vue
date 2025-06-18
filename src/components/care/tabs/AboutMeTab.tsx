
import React from "react";
import { Heart, ListCheck, BookOpen, Flame, Music, ThumbsUp, Clock, Coffee, Star, BookText, Calendar, Bookmark, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

interface AboutMeTabProps {
  personalInfo?: {
    cultural_preferences?: string;
    language_preferences?: string;
    religion?: string;
    marital_status?: string;
    preferred_communication?: string;
  };
  personalCare?: {
    behavioral_notes?: string;
    comfort_measures?: string;
    sleep_patterns?: string;
  };
}

export const AboutMeTab: React.FC<AboutMeTabProps> = ({ personalInfo, personalCare }) => {
  // Create preferences array from available data
  const preferences = [
    personalInfo?.cultural_preferences && `Cultural preference: ${personalInfo.cultural_preferences}`,
    personalInfo?.language_preferences && `Preferred language: ${personalInfo.language_preferences}`,
    personalInfo?.preferred_communication && `Communication: ${personalInfo.preferred_communication}`,
    personalCare?.comfort_measures && `Comfort measures: ${personalCare.comfort_measures}`
  ].filter(Boolean);

  // Create routines array from available data
  const routines = [
    personalCare?.sleep_patterns && `Sleep pattern: ${personalCare.sleep_patterns}`,
    personalInfo?.preferred_communication && `Daily communication preference: ${personalInfo.preferred_communication}`
  ].filter(Boolean);

  // Create interests array (placeholder since we don't have specific interests data)
  const interests = [
    personalInfo?.religion && `Religious activities related to ${personalInfo.religion}`,
    "Social activities with family and friends"
  ].filter(Boolean);

  // Create dislikes array from behavioral notes
  const dislikes = [
    personalCare?.behavioral_notes && `Behavioral considerations: ${personalCare.behavioral_notes}`
  ].filter(Boolean);

  if (!personalInfo && !personalCare) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No personal information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Preferences Card */}
      <Card className="animate-in fade-in-50 duration-300 hover:shadow-lg transition-all overflow-hidden group">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white border-b relative">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-300"></div>
          <CardTitle className="text-lg flex items-center gap-2 relative z-10">
            <Heart className="h-5 w-5 text-blue-600" />
            <span>Preferences</span>
          </CardTitle>
          <CardDescription className="relative z-10">Personal preferences that enhance care quality</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {preferences.length > 0 ? (
            <ul className="space-y-3">
              {preferences.map((pref, index) => (
                <li key={index} className="group/item relative">
                  <div className="text-sm flex items-start bg-blue-50/50 p-3 rounded-md border border-blue-100 group-hover/item:bg-blue-100/60 transition-colors transform group-hover/item:translate-x-1 duration-200">
                    <ThumbsUp className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{pref}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No preferences recorded</p>
          )}
        </CardContent>
      </Card>
      
      {/* Routines Card */}
      <Card className="animate-in fade-in-50 duration-300 delay-100 hover:shadow-lg transition-all overflow-hidden group">
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white border-b relative">
          <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors duration-300"></div>
          <CardTitle className="text-lg flex items-center gap-2 relative z-10">
            <ListCheck className="h-5 w-5 text-green-600" />
            <span>Daily Routines</span>
          </CardTitle>
          <CardDescription className="relative z-10">Established daily patterns and activities</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {routines.length > 0 ? (
            <ul className="space-y-3">
              {routines.map((routine, index) => (
                <li key={index} className="group/item relative">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="text-sm flex items-start bg-green-50/50 p-3 rounded-md border border-green-100 group-hover/item:bg-green-100/60 transition-colors transform group-hover/item:translate-x-1 duration-200 cursor-pointer">
                        <Clock className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{routine}</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="flex justify-between space-x-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">Routine Importance</h4>
                          <div className="flex items-center space-x-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-3 w-3 fill-current text-amber-400" />
                            ))}
                          </div>
                          <p className="text-sm">
                            Maintaining consistent routines helps provide stability, comfort, and reduces anxiety for the patient.
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No routines recorded</p>
          )}
        </CardContent>
      </Card>
      
      {/* Personal Information Card */}
      <Card className="animate-in fade-in-50 duration-300 delay-200 hover:shadow-lg transition-all overflow-hidden group">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white border-b relative">
          <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors duration-300"></div>
          <CardTitle className="text-lg flex items-center gap-2 relative z-10">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <span>Personal Details</span>
          </CardTitle>
          <CardDescription className="relative z-10">Cultural and personal background</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {personalInfo?.religion && (
              <div className="text-sm flex items-start bg-purple-50/50 p-3 rounded-md border border-purple-100">
                <BookText className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Religion: {personalInfo.religion}</span>
                </div>
              </div>
            )}
            
            {personalInfo?.marital_status && (
              <div className="text-sm flex items-start bg-purple-50/50 p-3 rounded-md border border-purple-100">
                <Heart className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Marital Status: {personalInfo.marital_status}</span>
                </div>
              </div>
            )}
            
            {!personalInfo?.religion && !personalInfo?.marital_status && (
              <p className="text-sm text-gray-500 text-center py-4">No personal details recorded</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Care Notes Card */}
      <Card className="animate-in fade-in-50 duration-300 delay-300 hover:shadow-lg transition-all overflow-hidden group">
        <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-white border-b relative">
          <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors duration-300"></div>
          <CardTitle className="text-lg flex items-center gap-2 relative z-10">
            <Flame className="h-5 w-5 text-amber-600" />
            <span>Care Considerations</span>
          </CardTitle>
          <CardDescription className="relative z-10">Important care notes and considerations</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {dislikes.length > 0 ? (
            <ul className="space-y-3">
              {dislikes.map((note, index) => (
                <li key={index} className="group/item relative">
                  <div className="text-sm flex items-start bg-amber-50/50 p-3 rounded-md border border-amber-100 group-hover/item:bg-amber-100/60 transition-colors transform group-hover/item:translate-x-1 duration-200">
                    <Calendar className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-medium">{note}</span>
                      <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 w-fit text-xs">
                        Important to note
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No care considerations recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
