import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { useHobbies } from "@/data/hooks/useHobbies";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface ClientHobbiesTabProps {
  clientId: string;
}

export function ClientHobbiesTab({ clientId }: ClientHobbiesTabProps) {
  const { data: hobbies = [], isLoading: hobbiesLoading, error } = useHobbies();
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const hobbiesOptions = hobbies.map((hobby) => ({
    value: hobby.id,
    label: hobby.title,
  }));

  // Load existing client hobbies from client data or localStorage
  useEffect(() => {
    const loadClientHobbies = () => {
      try {
        // For now, just use localStorage to persist hobbies per client
        const savedHobbies = localStorage.getItem(`client-hobbies-${clientId}`);
        if (savedHobbies) {
          setSelectedHobbies(JSON.parse(savedHobbies));
        }
      } catch (error) {
        console.error('Error loading client hobbies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      loadClientHobbies();
    }
  }, [clientId]);

  const handleSaveHobbies = async () => {
    if (!clientId) return;

    setIsSaving(true);
    try {
      // Save to localStorage for now (until database table is created)
      localStorage.setItem(`client-hobbies-${clientId}`, JSON.stringify(selectedHobbies));
      toast.success('Client hobbies updated successfully');
    } catch (error) {
      console.error('Error saving client hobbies:', error);
      toast.error('Failed to save client hobbies');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || hobbiesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading hobbies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <p>Failed to load hobbies. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Hobbies & Interests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Select the hobbies and interests that this client enjoys or is interested in pursuing.
          </p>
          
          <MultiSelect
            options={hobbiesOptions}
            selected={selectedHobbies}
            onSelectionChange={setSelectedHobbies}
            placeholder="Choose hobbies..."
            searchPlaceholder="Search hobbies..."
            emptyText="No hobbies found."
            maxDisplay={5}
          />

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSaveHobbies}
              disabled={isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Hobbies
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}