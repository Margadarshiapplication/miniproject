import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Camera, LogOut, User, MapPin, Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TRAVEL_STYLES = ["Adventure", "Cultural", "Relaxation", "Food & Drink", "Nature", "Nightlife", "Shopping", "History"];
const DESTINATIONS = ["Beach", "Mountains", "City", "Countryside", "Desert", "Tropical", "Arctic", "Islands"];

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [budgetPref, setBudgetPref] = useState(profile?.budget_preference || "moderate");
  const [travelStyles, setTravelStyles] = useState<string[]>(profile?.travel_style || []);
  const [destinations, setDestinations] = useState<string[]>(profile?.preferred_destinations || []);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        budget_preference: budgetPref,
        travel_style: travelStyles,
        preferred_destinations: destinations,
      });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar");
    }
  };

  const initials = (profile?.display_name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <h1 className="text-2xl font-bold font-heading">Profile</h1>

      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">{initials}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md"
          >
            {uploadAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <Separator />

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Basic Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget Preference</Label>
            <Select value={budgetPref} onValueChange={setBudgetPref}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="ultra-luxury">Ultra Luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Travel Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Travel Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TRAVEL_STYLES.map((style) => (
              <Badge
                key={style}
                variant={travelStyles.includes(style) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleItem(travelStyles, style, setTravelStyles)}
              >
                {style}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preferred Destinations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Preferred Destinations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DESTINATIONS.map((dest) => (
              <Badge
                key={dest}
                variant={destinations.includes(dest) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleItem(destinations, dest, setDestinations)}
              >
                {dest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Button className="w-full" onClick={handleSave} disabled={updateProfile.isPending}>
        {updateProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Save Changes
      </Button>

      <Button variant="outline" className="w-full text-destructive" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
};

export default Profile;
