import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit2, 
  DollarSign, 
  Users, 
  Building,
  Check,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_branches: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export const SubscriptionManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    max_users: '',
    max_branches: '',
    features: '',
    is_active: true
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });
      
      if (error) throw error;
      return data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
    }
  });

  const createPlan = useMutation({
    mutationFn: async (planData: any) => {
      const { error } = await supabase
        .from('subscription_plans')
        .insert([{
          ...planData,
          price_monthly: parseFloat(planData.price_monthly),
          price_yearly: parseFloat(planData.price_yearly),
          max_users: parseInt(planData.max_users),
          max_branches: parseInt(planData.max_branches),
          features: planData.features.split(',').map((f: string) => f.trim()).filter(Boolean)
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Subscription plan created successfully');
      setIsCreating(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create plan: ' + error.message);
    }
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, planData }: { id: string; planData: any }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          ...planData,
          price_monthly: parseFloat(planData.price_monthly),
          price_yearly: parseFloat(planData.price_yearly),
          max_users: parseInt(planData.max_users),
          max_branches: parseInt(planData.max_branches),
          features: planData.features.split(',').map((f: string) => f.trim()).filter(Boolean)
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Subscription plan updated successfully');
      setEditingPlan(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update plan: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_monthly: '',
      price_yearly: '',
      max_users: '',
      max_branches: '',
      features: '',
      is_active: true
    });
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price_monthly: plan.price_monthly.toString(),
      price_yearly: plan.price_yearly.toString(),
      max_users: plan.max_users.toString(),
      max_branches: plan.max_branches.toString(),
      features: plan.features.join(', '),
      is_active: plan.is_active
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, planData: formData });
    } else {
      createPlan.mutate(formData);
    }
  };

  const getPlanBadge = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return <Badge variant="secondary">Free</Badge>;
      case 'basic':
        return <Badge variant="default">Basic</Badge>;
      case 'professional':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Professional</Badge>;
      case 'enterprise':
        return <Badge variant="default" className="bg-purple-100 text-purple-800"><Star className="h-3 w-3 mr-1" />Enterprise</Badge>;
      default:
        return <Badge variant="outline">Custom</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading subscription plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage subscription plans and pricing
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating || editingPlan !== null}>
          <Plus className="mr-2 h-4 w-4" />
          New Plan
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingPlan) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
            </CardTitle>
            <CardDescription>
              {editingPlan ? 'Update the subscription plan details below.' : 'Create a new subscription plan with custom pricing and features.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Professional"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active Plan</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the plan benefits and target audience"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.01"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: e.target.value }))}
                    placeholder="29.99"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    step="0.01"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_yearly: e.target.value }))}
                    placeholder="299.99"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_users">Max Users</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_users: e.target.value }))}
                    placeholder="50"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_branches">Max Branches</Label>
                  <Input
                    id="max_branches"
                    type="number"
                    value={formData.max_branches}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_branches: e.target.value }))}
                    placeholder="5"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                  placeholder="all_features, priority_support, custom_branding, api_access"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createPlan.isPending || updatePlan.isPending}
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`hover:shadow-md transition-shadow ${!plan.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl capitalize">{plan.name}</CardTitle>
                    {getPlanBadge(plan.name)}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(plan)}
                  disabled={isCreating || editingPlan !== null}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-3xl font-bold">${plan.price_monthly}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <div className="text-sm text-gray-500">
                  ${plan.price_yearly}/year (save ${(plan.price_monthly * 12 - plan.price_yearly).toFixed(2)})
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Up to {plan.max_users} users</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-purple-600" />
                  <span>Up to {plan.max_branches} branches</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Features:</p>
                <div className="space-y-1">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-3 w-3 text-green-600" />
                      <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <div className="text-sm text-gray-500">
                      +{plan.features.length - 4} more features
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};