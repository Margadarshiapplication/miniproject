import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Compass, Mountain, Palmtree, Building, Tent, Ship, ChevronRight, ChevronLeft, Check } from "lucide-react";

const TRAVEL_STYLES = [
  { id: "adventure", label: "Adventure", icon: Mountain },
  { id: "beach", label: "Beach & Relax", icon: Palmtree },
  { id: "cultural", label: "Cultural", icon: Building },
  { id: "nature", label: "Nature", icon: Tent },
  { id: "cruise", label: "Cruise", icon: Ship },
  { id: "road-trip", label: "Road Trip", icon: Compass },
];

const BUDGET_OPTIONS = [
  { id: "budget", label: "Budget", description: "Hostels & street food" },
  { id: "moderate", label: "Moderate", description: "Comfortable stays" },
  { id: "luxury", label: "Luxury", description: "Premium experiences" },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [budget, setBudget] = useState("moderate");
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalSteps = 3;

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        travel_style: selectedStyles,
        budget_preference: budget,
        has_completed_onboarding: true,
      })
      .eq("id", user.id);
    setLoading(false);

    if (error) {
      toast({ title: "Error saving preferences", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      navigate("/", { replace: true });
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    setLoading(true);
    await supabase
      .from("profiles")
      .update({ has_completed_onboarding: true })
      .eq("id", user.id);
    await refreshProfile();
    setLoading(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8">
      {/* Progress */}
      <div className="mx-auto w-full max-w-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Step {step + 1} of {totalSteps}</span>
          <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground">
            Skip
          </button>
        </div>
        <div className="mb-8 flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 animate-fade-in">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Compass className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-heading">Welcome to Margdarshi!</h1>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Let's personalize your experience. Tell us about your travel preferences.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Travel Style */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-heading">What's your travel style?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TRAVEL_STYLES.map(({ id, label, icon: Icon }) => {
                const selected = selectedStyles.includes(id);
                return (
                  <Card
                    key={id}
                    className={`cursor-pointer transition-all ${
                      selected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "hover:border-primary/40"
                    }`}
                    onClick={() => toggleStyle(id)}
                  >
                    <CardContent className="flex flex-col items-center gap-2 p-4 relative">
                      {selected && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <Icon className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium">{label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Budget */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-heading">Your budget preference?</h2>
              <p className="mt-1 text-sm text-muted-foreground">You can always change this later</p>
            </div>
            <div className="space-y-3">
              {BUDGET_OPTIONS.map(({ id, label, description }) => (
                <Card
                  key={id}
                  className={`cursor-pointer transition-all ${
                    budget === id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "hover:border-primary/40"
                  }`}
                  onClick={() => setBudget(id)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    {budget === id && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mx-auto mt-8 flex w-full max-w-md items-center justify-between">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        ) : (
          <div />
        )}

        {step < totalSteps - 1 ? (
          <Button onClick={() => setStep(step + 1)}>
            {step === 0 ? "Get Started" : "Next"} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={loading}>
            {loading ? "Saving..." : "Complete"} <Check className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
