"use client";

import { trpc } from "@/lib/trpc";
import { Settings, Shield, Zap, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserTier = 'free' | 'tier_1' | 'tier_2';

interface RateLimitForm {
  minuteLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
}

function RateLimitCard({ 
  tier, 
  title, 
  description, 
  icon: Icon,
  initialData,
  onSave,
  onReset
}: { 
  tier: UserTier;
  title: string;
  description: string;
  icon: React.ElementType;
  initialData: RateLimitForm;
  onSave: (tier: UserTier, data: RateLimitForm) => void;
  onReset: (tier: UserTier) => void;
}) {
  const [formData, setFormData] = useState<RateLimitForm>(initialData);
  const [isChanged, setIsChanged] = useState(false);

  const handleChange = (field: keyof RateLimitForm, value: string) => {
    const num = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [field]: num }));
    setIsChanged(true);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        <div className="space-y-2">
          <Label htmlFor={`minute-${tier}`}>Minute Limit (Requests/min)</Label>
          <Input 
            id={`minute-${tier}`}
            type="number" 
            value={formData.minuteLimit}
            onChange={(e) => handleChange('minuteLimit', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`daily-${tier}`}>Daily Limit (Requests/day)</Label>
          <Input 
            id={`daily-${tier}`}
            type="number" 
            value={formData.dailyLimit}
            onChange={(e) => handleChange('dailyLimit', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`monthly-${tier}`}>Monthly Limit (Requests/month)</Label>
          <Input 
            id={`monthly-${tier}`}
            type="number" 
            value={formData.monthlyLimit}
            onChange={(e) => handleChange('monthlyLimit', e.target.value)}
          />
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4 border-t bg-muted/20">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => onReset(tier)}
          title="Reset to defaults"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button 
          className="flex-1"
          onClick={() => onSave(tier, formData)}
          disabled={!isChanged}
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function PlatformSettingsPage() {
  const ctx = trpc.useContext();
  const { data: limits, isLoading, error } = trpc.platformSettings.getRateLimits.useQuery();
  
  const updateMutation = trpc.platformSettings.updateRateLimits.useMutation({
    onSuccess: () => {
      ctx.platformSettings.getRateLimits.invalidate();
      // Optional: Add toast notification here
      alert("Settings updated successfully!");
    }
  });
  
  const resetMutation = trpc.platformSettings.resetToDefaults.useMutation({
    onSuccess: () => {
      ctx.platformSettings.getRateLimits.invalidate();
      alert("Settings reset to defaults!");
    }
  });

  const handleSave = (tier: UserTier, data: RateLimitForm) => {
    updateMutation.mutate({
      tier,
      config: data
    });
  };

  const handleReset = (tier: UserTier) => {
    if (confirm(`Are you sure you want to reset ${tier} limits to default?`)) {
      resetMutation.mutate({ tier });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[400px] animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded mb-2" />
                <div className="h-4 w-48 bg-muted rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Settings</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => ctx.platformSettings.getRateLimits.invalidate()}>Retry</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!limits) return null;

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure global API rate limits for each user tier.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RateLimitCard 
          key={`free-${JSON.stringify(limits.free)}`}
          tier="free"
          title="Free Plan"
          description="Default limits for free users"
          icon={Settings}
          initialData={limits.free}
          onSave={handleSave}
          onReset={handleReset}
        />
        
        <RateLimitCard 
          key={`tier1-${JSON.stringify(limits.tier_1)}`}
          tier="tier_1"
          title="Basic Plan (Tier 1)"
          description="Limits for paying basic users"
          icon={Shield}
          initialData={limits.tier_1}
          onSave={handleSave}
          onReset={handleReset}
        />

        <RateLimitCard 
          key={`tier2-${JSON.stringify(limits.tier_2)}`}
          tier="tier_2"
          title="Pro Plan (Tier 2)"
          description="Limits for power users"
          icon={Zap}
          initialData={limits.tier_2}
          onSave={handleSave}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}
