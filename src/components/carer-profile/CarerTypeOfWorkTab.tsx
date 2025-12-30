import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Clock, MapPin, Users, Heart, Edit, Save, X, Loader2 } from "lucide-react";
import { useStaffWorkPreferences, useUpdateStaffWorkPreferences } from "@/hooks/useStaffWorkPreferences";

interface CarerTypeOfWorkTabProps {
  carerId: string;
}

const defaultPreferences = {
  clientTypes: [] as string[],
  serviceTypes: [] as string[],
  workPatterns: [] as string[],
  locations: [] as string[],
  travelDistance: 10,
  specialNotes: ''
};

export const CarerTypeOfWorkTab: React.FC<CarerTypeOfWorkTabProps> = ({ carerId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);

  const { data: savedPreferences, isLoading } = useStaffWorkPreferences(carerId);
  const updatePreferences = useUpdateStaffWorkPreferences();

  // Sync local state with fetched data
  useEffect(() => {
    if (savedPreferences) {
      setPreferences({
        clientTypes: savedPreferences.client_types || [],
        serviceTypes: savedPreferences.service_types || [],
        workPatterns: savedPreferences.work_patterns || [],
        locations: savedPreferences.work_locations || [],
        travelDistance: savedPreferences.travel_distance || 10,
        specialNotes: savedPreferences.special_notes || ''
      });
    }
  }, [savedPreferences]);

  const clientTypeOptions = [
    { id: 'elderly', label: 'Elderly Care', icon: Heart },
    { id: 'adults_learning_disabilities', label: 'Adults with Learning Disabilities', icon: Users },
    { id: 'physical_disabilities', label: 'Physical Disabilities', icon: Users },
    { id: 'mental_health', label: 'Mental Health Support', icon: Heart },
    { id: 'dementia', label: 'Dementia Care', icon: Heart },
    { id: 'end_of_life', label: 'End of Life Care', icon: Heart },
    { id: 'young_adults', label: 'Young Adults (18-65)', icon: Users }
  ];

  const serviceTypeOptions = [
    { id: 'personal_care', label: 'Personal Care' },
    { id: 'companionship', label: 'Companionship' },
    { id: 'domestic_support', label: 'Domestic Support' },
    { id: 'medication', label: 'Medication Administration' },
    { id: 'transport', label: 'Transport & Mobility' },
    { id: 'shopping', label: 'Shopping & Errands' },
    { id: 'meal_prep', label: 'Meal Preparation' },
    { id: 'overnight', label: 'Overnight Care' }
  ];

  const workPatternOptions = [
    { id: 'morning_shifts', label: 'Morning Shifts (6am-2pm)' },
    { id: 'day_shifts', label: 'Day Shifts (8am-4pm)' },
    { id: 'evening_shifts', label: 'Evening Shifts (2pm-10pm)' },
    { id: 'night_shifts', label: 'Night Shifts (10pm-6am)' },
    { id: 'weekend_work', label: 'Weekend Work' },
    { id: 'bank_holidays', label: 'Bank Holidays' },
    { id: 'flexible_hours', label: 'Flexible Hours' }
  ];

  const locationOptions = [
    { id: 'client_home', label: 'Client\'s Home' },
    { id: 'residential', label: 'Residential Care Home' },
    { id: 'supported_living', label: 'Supported Living' },
    { id: 'day_center', label: 'Day Center' },
    { id: 'community', label: 'Community Settings' }
  ];

  const handleCheckboxChange = (category: string, value: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [category]: checked 
        ? [...(prev[category as keyof typeof prev] as string[]), value]
        : (prev[category as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const handleSave = async () => {
    await updatePreferences.mutateAsync({
      staff_id: carerId,
      client_types: preferences.clientTypes,
      service_types: preferences.serviceTypes,
      work_patterns: preferences.workPatterns,
      work_locations: preferences.locations,
      travel_distance: preferences.travelDistance,
      special_notes: preferences.specialNotes
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to saved data
    if (savedPreferences) {
      setPreferences({
        clientTypes: savedPreferences.client_types || [],
        serviceTypes: savedPreferences.service_types || [],
        workPatterns: savedPreferences.work_patterns || [],
        locations: savedPreferences.work_locations || [],
        travelDistance: savedPreferences.travel_distance || 10,
        specialNotes: savedPreferences.special_notes || ''
      });
    } else {
      setPreferences(defaultPreferences);
    }
    setIsEditing(false);
  };

  const hasNoPreferences = !savedPreferences && !isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Preferences
          </CardTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={updatePreferences.isPending}>
                  {updatePreferences.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={updatePreferences.isPending}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Preferences
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasNoPreferences && !isEditing && (
            <div className="text-center py-6 text-muted-foreground">
              <p>No preferences set yet. Click "Edit Preferences" to add your work preferences.</p>
            </div>
          )}

          {(isEditing || !hasNoPreferences) && (
            <>
              {/* Client Types */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Preferred Client Types
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {clientTypeOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <Checkbox
                            id={option.id}
                            checked={preferences.clientTypes.includes(option.id)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange('clientTypes', option.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={option.id}>{option.label}</Label>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            preferences.clientTypes.includes(option.id) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
                          <span className={preferences.clientTypes.includes(option.id) ? 'text-foreground' : 'text-muted-foreground'}>
                            {option.label}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Types */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Service Types
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {serviceTypeOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <Checkbox
                            id={option.id}
                            checked={preferences.serviceTypes.includes(option.id)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange('serviceTypes', option.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={option.id}>{option.label}</Label>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            preferences.serviceTypes.includes(option.id) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
                          <span className={preferences.serviceTypes.includes(option.id) ? 'text-foreground' : 'text-muted-foreground'}>
                            {option.label}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Patterns */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Work Patterns
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workPatternOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <Checkbox
                            id={option.id}
                            checked={preferences.workPatterns.includes(option.id)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange('workPatterns', option.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={option.id}>{option.label}</Label>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            preferences.workPatterns.includes(option.id) ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
                          <span className={preferences.workPatterns.includes(option.id) ? 'text-foreground' : 'text-muted-foreground'}>
                            {option.label}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Locations */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Work Locations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {locationOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <Checkbox
                            id={option.id}
                            checked={preferences.locations.includes(option.id)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange('locations', option.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={option.id}>{option.label}</Label>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            preferences.locations.includes(option.id) ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
                          <span className={preferences.locations.includes(option.id) ? 'text-foreground' : 'text-muted-foreground'}>
                            {option.label}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <h3 className="font-semibold mb-3">Special Notes & Requirements</h3>
                {isEditing ? (
                  <Textarea
                    value={preferences.specialNotes}
                    onChange={(e) => setPreferences(prev => ({ ...prev, specialNotes: e.target.value }))}
                    rows={4}
                    placeholder="Add any special notes about your work preferences..."
                  />
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{preferences.specialNotes || 'No special notes added.'}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Work Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {hasNoPreferences ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No work preferences configured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Preferred Client Types</h4>
                <div className="flex flex-wrap gap-2">
                  {preferences.clientTypes.length > 0 ? (
                    preferences.clientTypes.map(type => (
                      <Badge key={type} variant="secondary">
                        {clientTypeOptions.find(opt => opt.id === type)?.label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Service Types</h4>
                <div className="flex flex-wrap gap-2">
                  {preferences.serviceTypes.length > 0 ? (
                    preferences.serviceTypes.map(type => (
                      <Badge key={type} variant="outline">
                        {serviceTypeOptions.find(opt => opt.id === type)?.label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Work Patterns</h4>
                <div className="flex flex-wrap gap-2">
                  {preferences.workPatterns.length > 0 ? (
                    preferences.workPatterns.map(pattern => (
                      <Badge key={pattern} className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {workPatternOptions.find(opt => opt.id === pattern)?.label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Work Locations</h4>
                <div className="flex flex-wrap gap-2">
                  {preferences.locations.length > 0 ? (
                    preferences.locations.map(location => (
                      <Badge key={location} className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        {locationOptions.find(opt => opt.id === location)?.label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
