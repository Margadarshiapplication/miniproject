import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Sparkles, Compass, ChevronRight, Calendar, ArrowLeftRight, HelpCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { destinations } from "@/data/destinations";
import { useTrips } from "@/hooks/useTrips";

// All supported currencies
const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "रू" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
];

// Cache key for rates
const RATES_CACHE_KEY = "margdarshi_exchange_rates";
const CACHE_TTL = 3600000; // 1 hour

interface CachedRates {
  rates: Record<string, number>;
  timestamp: number;
}

function getCachedRates(): CachedRates | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRates = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCachedRates(rates: Record<string, number>) {
  localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
}

// Fallback rates (approximate, April 2026)
const FALLBACK_RATES: Record<string, number> = {
  USD: 0.0119, EUR: 0.0108, GBP: 0.0094, JPY: 1.78, AUD: 0.0183,
  CAD: 0.0163, SGD: 0.016, THB: 0.41, AED: 0.0437, MYR: 0.053,
  LKR: 3.55, NPR: 1.6, BDT: 1.43, CHF: 0.0105, CNY: 0.087,
  KRW: 16.3, NZD: 0.02, ZAR: 0.215, SEK: 0.124, IDR: 188,
};

const Index = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: trips } = useTrips();
  const recentTrips = trips?.slice(0, 3) ?? [];

  const displayName = profile?.display_name || "Traveler";

  // Currency converter state
  const [convAmount, setConvAmount] = useState("1000");
  const [convTo, setConvTo] = useState("USD");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchLiveRates = async () => {
    setRatesLoading(true);
    try {
      // Free API — no key required
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/INR");
      if (res.ok) {
        const data = await res.json();
        setRates(data.rates);
        setCachedRates(data.rates);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch {
      // Use fallback rates silently
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCachedRates();
    if (cached) {
      setRates(cached.rates);
      setLastUpdated(new Date(cached.timestamp).toLocaleTimeString());
    } else {
      fetchLiveRates();
    }
  }, []);

  const converted = convAmount && rates[convTo]
    ? (parseFloat(convAmount) * rates[convTo]).toFixed(2)
    : "—";

  const currSymbol = CURRENCIES.find((c) => c.code === convTo)?.symbol || "";

  // Suggest destinations based on user's travel_style preferences
  const suggested = profile?.travel_style?.length
    ? destinations.filter((d) => d.mood.some((m) => profile.travel_style.includes(m))).slice(0, 4)
    : destinations.slice(0, 4);

  const quickActions = [
    { icon: Sparkles, label: "AI Coach", color: "bg-primary/10 text-primary", path: "/coach" },
    { icon: MapPin, label: "Plan Trip", color: "bg-secondary/10 text-secondary", path: "/plan" },
    { icon: Compass, label: "Discover", color: "bg-accent/20 text-accent-foreground", path: "/discover" },
  ];

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold font-heading">
          Hello, {displayName}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Where do you want to go today?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map(({ icon: Icon, label, color, path }) => (
          <Card
            key={label}
            className="cursor-pointer transition-all hover:shadow-md active:scale-95"
            onClick={() => navigate(path)}
          >
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <div className={`rounded-xl p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Currency Converter */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-primary" /> Currency Converter
            </h3>
            <button
              onClick={fetchLiveRates}
              disabled={ratesLoading}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${ratesLoading ? "animate-spin" : ""}`} />
              {ratesLoading ? "Updating..." : "Refresh"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground mb-1">INR (₹)</p>
              <Input
                type="number"
                placeholder="Amount in INR"
                value={convAmount}
                onChange={(e) => setConvAmount(e.target.value)}
                className="text-sm"
              />
            </div>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0 mt-4" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground mb-1">{convTo} ({currSymbol})</p>
              <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm font-bold text-primary">
                {currSymbol}{converted}
              </div>
            </div>
          </div>

          <Select value={convTo} onValueChange={setConvTo}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {lastUpdated && (
            <p className="text-[10px] text-muted-foreground text-center">
              Rates updated: {lastUpdated} · Powered by ExchangeRate API
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-heading">Recent Trips</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/trips")}>
            View all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        {recentTrips.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No trips yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/plan")}>
                Plan your first trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentTrips.map((trip) => (
              <Card
                key={trip.id}
                className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                onClick={() => navigate(`/itinerary/${trip.id}`)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  {trip.cover_image ? (
                    <img src={trip.cover_image} alt={trip.destination} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{trip.destination}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Destinations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-heading">Suggested for You</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/discover")}>
            See all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {suggested.map((dest) => (
            <Card
              key={dest.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              onClick={() => navigate(`/destination/${dest.id}`)}
            >
              <div className="relative h-28">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-2 left-2.5">
                  <p className="text-sm font-bold text-white">{dest.name}</p>
                  <p className="text-[10px] text-white/80">{dest.tagline}</p>
                </div>
              </div>
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{dest.costEstimate.daily}/day</span>
                  <span className="text-[10px] font-medium text-primary">⭐ {dest.rating}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help & Support Card */}
      <Card
        className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98] bg-muted/30"
        onClick={() => navigate("/support")}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Help & Support</p>
            <p className="text-xs text-muted-foreground">FAQs · Contact us · Report issues</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
