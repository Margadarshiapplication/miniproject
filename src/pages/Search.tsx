import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, TrendingUp, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { destinations } from "@/data/destinations";

const trending = ["Ladakh", "Goa", "Kerala", "Manali"];

const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("searchHistory") || "[]");
    } catch {
      return [];
    }
  });

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return destinations.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q) ||
        d.mood.some((m) => m.includes(q)) ||
        d.activities.some((a) => a.toLowerCase().includes(q))
    );
  }, [query]);

  const handleSelect = (dest: (typeof destinations)[0]) => {
    const updated = [dest.name, ...history.filter((h) => h !== dest.name)].slice(0, 8);
    setHistory(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
    navigate(`/destination/${dest.id}`);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const handleHistoryClick = (term: string) => setQuery(term);

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search destinations, activities…"
          className="pl-9 pr-9"
          autoFocus
        />
        {query && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setQuery("")}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Results */}
      {query.trim() ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {results.length} result{results.length !== 1 && "s"}
          </p>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No destinations found for "{query}"</p>
            </div>
          ) : (
            results.map((dest) => (
              <Card
                key={dest.id}
                className="cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                onClick={() => handleSelect(dest)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <img src={dest.image} alt={dest.name} className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{dest.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{dest.tagline}</p>
                    <p className="text-[10px] text-primary mt-0.5">{dest.costEstimate.daily}/day · ⭐ {dest.rating}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Search History */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Recent
                </p>
                <Button variant="ghost" size="sm" className="text-xs h-auto py-0.5" onClick={clearHistory}>
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleHistoryClick(term)}
                    className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-foreground hover:border-primary/40 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Trending
            </p>
            <div className="grid grid-cols-2 gap-2">
              {trending.map((name) => {
                const dest = destinations.find((d) => d.name === name);
                if (!dest) return null;
                return (
                  <Card
                    key={dest.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                    onClick={() => handleSelect(dest)}
                  >
                    <div className="relative h-20">
                      <img src={dest.image} alt={dest.name} className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                      <p className="absolute bottom-2 left-2.5 text-xs font-bold text-white">{dest.name}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;
