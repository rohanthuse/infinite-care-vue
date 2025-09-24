import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, Edit, Trash2, Star, Users, AlertCircle } from "lucide-react";
import { useHobbies } from "@/data/hooks/useHobbies";
import { useStaffHobbies, useAddStaffHobby, useRemoveStaffHobby, useUpdateStaffHobby } from "@/hooks/useStaffHobbies";
import { useToast } from "@/hooks/use-toast";

interface CarerHobbiesTabProps {
  carerId: string;
}

export const CarerHobbiesTab: React.FC<CarerHobbiesTabProps> = ({ carerId }) => {
  const { toast } = useToast();
  const { data: availableHobbies = [] } = useHobbies();
  const { data: staffHobbies = [], isLoading, error } = useStaffHobbies(carerId);
  const addHobbyMutation = useAddStaffHobby();
  const removeHobbyMutation = useRemoveStaffHobby();
  const updateHobbyMutation = useUpdateStaffHobby();
  
  const [showAddHobby, setShowAddHobby] = useState(false);
  const [editingHobby, setEditingHobby] = useState<string | null>(null);

  const [newHobby, setNewHobby] = useState({
    hobby_id: '',
    proficiencyLevel: 'beginner' as const,
    notes: '',
    enjoys_teaching: false
  });

  const proficiencyLevels = ['beginner', 'intermediate', 'advanced'];

  const getProficiencyBadge = (level: string) => {
    switch (level) {
      case 'advanced':
        return <Badge className="bg-blue-100 text-blue-800">Advanced</Badge>;
      case 'intermediate':
        return <Badge className="bg-amber-100 text-amber-800">Intermediate</Badge>;
      case 'beginner':
        return <Badge className="bg-gray-100 text-gray-800">Beginner</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const getProficiencyStars = (level: string) => {
    const stars = level === 'advanced' ? 3 : level === 'intermediate' ? 2 : 1;
    return [...Array(3)].map((_, i) => (
      <Star key={i} className={`h-3 w-3 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  const handleAddHobby = async () => {
    try {
      await addHobbyMutation.mutateAsync({
        staff_id: carerId,
        hobby_id: newHobby.hobby_id,
        proficiency_level: newHobby.proficiencyLevel,
        enjoys_teaching: newHobby.enjoys_teaching,
        notes: newHobby.notes || null
      });
      
      setNewHobby({
        hobby_id: '',
        proficiencyLevel: 'beginner' as const,
        notes: '',
        enjoys_teaching: false
      });
      setShowAddHobby(false);
      
      toast({
        title: "Hobby added",
        description: "Hobby has been added to your profile successfully."
      });
    } catch (error) {
      toast({
        title: "Error adding hobby",
        description: "Failed to add hobby. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteHobby = async (id: string) => {
    try {
      await removeHobbyMutation.mutateAsync(id);
      toast({
        title: "Hobby removed",
        description: "Hobby has been removed from your profile."
      });
    } catch (error) {
      toast({
        title: "Error removing hobby",
        description: "Failed to remove hobby. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading hobbies...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Error Loading Hobbies</h3>
            <p className="text-muted-foreground">Unable to load hobby data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Personal Hobbies & Interests
          </CardTitle>
          <Button onClick={() => setShowAddHobby(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hobby
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{staffHobbies.length}</div>
              <div className="text-sm text-muted-foreground">Total Hobbies</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {staffHobbies.filter(h => h.enjoys_teaching).length}
              </div>
              <div className="text-sm text-muted-foreground">Can Teach Others</div>
            </div>
          </div>

          <div className="space-y-4">
            {staffHobbies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hobbies added yet. Add your first hobby to get started!</p>
              </div>
            ) : (
              staffHobbies.map((hobby) => (
                <Card key={hobby.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{hobby.hobby?.title}</h4>
                          {hobby.enjoys_teaching && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Can Teach
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getProficiencyBadge(hobby.proficiency_level)}
                          <div className="flex">{getProficiencyStars(hobby.proficiency_level)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingHobby(hobby.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteHobby(hobby.id)}
                        disabled={removeHobbyMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {hobby.notes && (
                    <p className="text-sm text-muted-foreground mb-3">{hobby.notes}</p>
                  )}
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {showAddHobby && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Hobby</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hobby-select">Select Hobby</Label>
                <Select value={newHobby.hobby_id} onValueChange={(value) => setNewHobby({...newHobby, hobby_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a hobby" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHobbies
                      .filter(hobby => !staffHobbies.some(sh => sh.hobby_id === hobby.id))
                      .map(hobby => (
                        <SelectItem key={hobby.id} value={hobby.id}>{hobby.title}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="proficiency">Proficiency Level</Label>
                <Select value={newHobby.proficiencyLevel} onValueChange={(value: any) => setNewHobby({...newHobby, proficiencyLevel: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {proficiencyLevels.map(level => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newHobby.notes}
                onChange={(e) => setNewHobby({...newHobby, notes: e.target.value})}
                placeholder="Tell us about your experience with this hobby..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enjoys-teaching"
                checked={newHobby.enjoys_teaching}
                onChange={(e) => setNewHobby({...newHobby, enjoys_teaching: e.target.checked})}
              />
              <Label htmlFor="enjoys-teaching">I enjoy teaching this hobby to others</Label>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleAddHobby}
                disabled={!newHobby.hobby_id || addHobbyMutation.isPending}
              >
                {addHobbyMutation.isPending ? 'Adding...' : 'Add Hobby'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddHobby(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Proficiency Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proficiencyLevels.map(level => {
              const count = staffHobbies.filter(h => h.proficiency_level === level).length;
              return (
                <div key={level} className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground">{level.charAt(0).toUpperCase() + level.slice(1)}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};