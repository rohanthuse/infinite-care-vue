
import React from "react";
import { Heart, ListCheck, BookOpen, Flame, Music, ThumbsUp, Clock, Coffee } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="animate-in fade-in-50 duration-300">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-blue-600" />
            <span>Preferences</span>
          </CardTitle>
          <CardDescription>Personal preferences to be aware of when providing care</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2">
            {aboutMe.preferences.map((pref, index) => (
              <li key={index} className="text-sm flex items-start bg-blue-50/50 p-2 rounded-md border border-blue-100">
                <ThumbsUp className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>{pref}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="animate-in fade-in-50 duration-300 delay-100">
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListCheck className="h-5 w-5 text-green-600" />
            <span>Daily Routines</span>
          </CardTitle>
          <CardDescription>Regular activities and schedule preferences</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2">
            {aboutMe.routines.map((routine, index) => (
              <li key={index} className="text-sm flex items-start bg-green-50/50 p-2 rounded-md border border-green-100">
                <Clock className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{routine}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="animate-in fade-in-50 duration-300 delay-200">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <span>Interests & Hobbies</span>
          </CardTitle>
          <CardDescription>Activities and topics the patient enjoys</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2">
            {aboutMe.interests.map((interest, index) => (
              <li key={index} className="text-sm flex items-start bg-purple-50/50 p-2 rounded-md border border-purple-100">
                <Music className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>{interest}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="animate-in fade-in-50 duration-300 delay-300">
        <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-white">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-600" />
            <span>Dislikes & Concerns</span>
          </CardTitle>
          <CardDescription>Things to avoid or be mindful of</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2">
            {aboutMe.dislikes.map((dislike, index) => (
              <li key={index} className="text-sm flex items-start bg-amber-50/50 p-2 rounded-md border border-amber-100">
                <Coffee className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{dislike}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
