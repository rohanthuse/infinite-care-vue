import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, Edit, Trash2, Star, Users } from "lucide-react";
import { useHobbies } from "@/data/hooks/useHobbies";

interface CarerHobbiesTabProps {
  carerId: string;
}

export const CarerHobbiesTab: React.FC<CarerHobbiesTabProps> = ({ carerId }) => {
  const { data: availableHobbies = [] } = useHobbies();
  const [showAddHobby, setShowAddHobby] = useState(false);
  const [editingHobby, setEditingHobby] = useState<number | null>(null);

  const [userHobbies, setUserHobbies] = useState([
    {
      id: 1,
      name: 'Reading',
      category: 'Indoor',
      proficiencyLevel: 'expert',
      yearsExperience: 15,
      description: 'I love reading various genres including fiction, biographies, and self-help books. I often share book recommendations with clients.',
      useWithClients: true,
      certifications: []
    },
    {
      id: 2,
      name: 'Gardening',
      category: 'Outdoor',
      proficiencyLevel: 'intermediate',
      yearsExperience: 8,
      description: 'Passionate about growing vegetables and flowers. I enjoy therapeutic gardening activities with clients.',
      useWithClients: true,
      certifications: ['RHS Level 2']
    },
    {
      id: 3,
      name: 'Cooking',
      category: 'Creative',
      proficiencyLevel: 'advanced',
      yearsExperience: 20,
      description: 'Love preparing healthy, delicious meals. Specialized in dietary requirements and cultural cuisines.',
      useWithClients: true,
      certifications: ['Food Hygiene Certificate']
    },
    {
      id: 4,
      name: 'Photography',
      category: 'Creative',
      proficiencyLevel: 'beginner',
      yearsExperience: 2,
      description: 'Recently started learning photography as a creative outlet.',
      useWithClients: false,
      certifications: []
    }
  ]);

  const [newHobby, setNewHobby] = useState({
    name: '',
    category: '',
    proficiencyLevel: '',
    yearsExperience: 0,
    description: '',
    useWithClients: false,
    certifications: []
  });

  const categories = ['Indoor', 'Outdoor', 'Creative', 'Physical', 'Social', 'Educational', 'Music', 'Arts'];
  const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

  const getProficiencyBadge = (level: string) => {
    switch (level) {
      case 'expert':
        return <Badge className="bg-green-100 text-green-800">Expert</Badge>;
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
    const stars = level === 'expert' ? 4 : level === 'advanced' ? 3 : level === 'intermediate' ? 2 : 1;
    return [...Array(4)].map((_, i) => (
      <Star key={i} className={`h-3 w-3 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  const handleAddHobby = () => {
    const hobby = {
      ...newHobby,
      id: Date.now(),
    };
    setUserHobbies([...userHobbies, hobby]);
    setNewHobby({
      name: '',
      category: '',
      proficiencyLevel: '',
      yearsExperience: 0,
      description: '',
      useWithClients: false,
      certifications: []
    });
    setShowAddHobby(false);
  };

  const handleDeleteHobby = (id: number) => {
    setUserHobbies(userHobbies.filter(hobby => hobby.id !== id));
  };

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
              <div className="text-2xl font-bold text-blue-600">{userHobbies.length}</div>
              <div className="text-sm text-muted-foreground">Total Hobbies</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {userHobbies.filter(h => h.useWithClients).length}
              </div>
              <div className="text-sm text-muted-foreground">Used with Clients</div>
            </div>
          </div>

          <div className="space-y-4">
            {userHobbies.map((hobby) => (
              <Card key={hobby.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{hobby.name}</h4>
                        <Badge variant="outline">{hobby.category}</Badge>
                        {hobby.useWithClients && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Client Activity
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getProficiencyBadge(hobby.proficiencyLevel)}
                        <div className="flex">{getProficiencyStars(hobby.proficiencyLevel)}</div>
                        <span className="text-sm text-muted-foreground">
                          {hobby.yearsExperience} years experience
                        </span>
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
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{hobby.description}</p>
                
                {hobby.certifications && hobby.certifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Certifications:</span>
                    <div className="flex flex-wrap gap-1">
                      {hobby.certifications.map((cert, index) => (
                        <Badge key={index} className="bg-purple-100 text-purple-800 text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
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
                <Label htmlFor="hobby-name">Hobby Name</Label>
                <Input
                  id="hobby-name"
                  value={newHobby.name}
                  onChange={(e) => setNewHobby({...newHobby, name: e.target.value})}
                  placeholder="e.g., Reading, Gardening, Cooking"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newHobby.category} onValueChange={(value) => setNewHobby({...newHobby, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="proficiency">Proficiency Level</Label>
                <Select value={newHobby.proficiencyLevel} onValueChange={(value) => setNewHobby({...newHobby, proficiencyLevel: value})}>
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
              
              <div>
                <Label htmlFor="years">Years of Experience</Label>
                <Input
                  id="years"
                  type="number"
                  value={newHobby.yearsExperience}
                  onChange={(e) => setNewHobby({...newHobby, yearsExperience: parseInt(e.target.value)})}
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newHobby.description}
                onChange={(e) => setNewHobby({...newHobby, description: e.target.value})}
                placeholder="Describe your hobby and how you enjoy it..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-with-clients"
                checked={newHobby.useWithClients}
                onChange={(e) => setNewHobby({...newHobby, useWithClients: e.target.checked})}
              />
              <Label htmlFor="use-with-clients">I can use this hobby in activities with clients</Label>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddHobby}>Add Hobby</Button>
              <Button variant="outline" onClick={() => setShowAddHobby(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hobby Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(category => {
              const count = userHobbies.filter(h => h.category === category).length;
              return (
                <div key={category} className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground">{category}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};