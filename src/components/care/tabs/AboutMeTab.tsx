
import React from "react";
import { Heart, ListCheck, BookOpen, Flame, Music, ThumbsUp, Clock, Coffee } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface AboutMeTabProps {
  aboutMe: {
    preferences: string[];
    routines: string[];
    interests: string[];
    dislikes: string[];
  };
}

export const AboutMeTab: React.FC<AboutMeTabProps> = ({ aboutMe }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="animate-in fade-in-50 duration-300 hover:shadow-lg transition-all">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-blue-600" />
            <span>Preferences</span>
          </CardTitle>
          <CardDescription>Personal preferences that enhance care quality</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-3">
            {aboutMe.preferences.map((pref, index) => (
              <li key={index} className="group relative">
                <div className="text-sm flex items-start bg-blue-50/50 p-3 rounded-md border border-blue-100 group-hover:bg-blue-100/60 transition-colors">
                  <ThumbsUp className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{pref}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="animate-in fade-in-50 duration-300 delay-100 hover:shadow-lg transition-all">
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListCheck className="h-5 w-5 text-green-600" />
            <span>Daily Routines</span>
          </CardTitle>
          <CardDescription>Established daily patterns and activities</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-3">
            {aboutMe.routines.map((routine, index) => (
              <li key={index} className="group relative">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="text-sm flex items-start bg-green-50/50 p-3 rounded-md border border-green-100 group-hover:bg-green-100/60 transition-colors cursor-pointer">
                      <Clock className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{routine}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex justify-between space-x-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">Routine Importance</h4>
                        <p className="text-sm">
                          Maintaining consistent routines helps provide stability and comfort.
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="animate-in fade-in-50 duration-300 delay-200 hover:shadow-lg transition-all">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <span>Interests & Hobbies</span>
          </CardTitle>
          <CardDescription>Activities and topics the patient enjoys</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-3">
            {aboutMe.interests.map((interest, index) => (
              <li key={index} className="group relative">
                <div className="text-sm flex items-start bg-purple-50/50 p-3 rounded-md border border-purple-100 group-hover:bg-purple-100/60 transition-colors">
                  <Music className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{interest}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="animate-in fade-in-50 duration-300 delay-300 hover:shadow-lg transition-all">
        <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-white border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-600" />
            <span>Dislikes & Concerns</span>
          </CardTitle>
          <CardDescription>Things to avoid or be mindful of</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-3">
            {aboutMe.dislikes.map((dislike, index) => (
              <li key={index} className="group relative">
                <div className="text-sm flex items-start bg-amber-50/50 p-3 rounded-md border border-amber-100 group-hover:bg-amber-100/60 transition-colors">
                  <Coffee className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{dislike}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
