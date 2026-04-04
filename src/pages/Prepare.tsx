import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Package, FileText, Plus, CheckCircle2, Circle, CloudSun, ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useTrip,
  usePackingItems,
  useDocumentChecklist,
  useAddPackingItem,
  useTogglePackingItem,
  useAddDocument,
  useToggleDocument,
  type PackingItem,
} from "@/hooks/useTrips";
import { destinations } from "@/data/destinations";
import { toast } from "@/hooks/use-toast";

const packingCategories = [
  { id: "essentials", label: "Essentials", emoji: "🎒" },
  { id: "clothing", label: "Clothing", emoji: "👕" },
  { id: "toiletries", label: "Toiletries", emoji: "🧴" },
  { id: "electronics", label: "Electronics", emoji: "🔌" },
  { id: "documents", label: "Documents", emoji: "📄" },
  { id: "medicine", label: "Medicine", emoji: "💊" },
  { id: "other", label: "Other", emoji: "📦" },
];

const defaultDocuments = [
  "ID / Passport",
  "Tickets / Boarding Pass",
  "Hotel Booking Confirmation",
  "Travel Insurance",
  "Emergency Contacts",
];

const Prepare = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { data: packingItems } = usePackingItems(tripId);
  const { data: documents } = useDocumentChecklist(tripId);
  const addPacking = useAddPackingItem();
  const togglePacking = useTogglePackingItem();
  const addDocument = useAddDocument();
  const toggleDocument = useToggleDocument();

  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("essentials");
  const [newDocName, setNewDocName] = useState("");
  const [convAmount, setConvAmount] = useState("");
  const [convFrom] = useState("INR");
  const [convTo, setConvTo] = useState("USD");

  const dest = trip?.destination_id ? destinations.find((d) => d.id === trip.destination_id) : null;

  const handleAddItem = async () => {
    if (!newItem.trim() || !tripId) return;
    try {
      await addPacking.mutateAsync({ trip_id: tripId, category: newCategory, item_name: newItem.trim() });
      setNewItem("");
    } catch {
      toast({ title: "Failed to add item", variant: "destructive" });
    }
  };

  const handleAddDoc = async (name?: string) => {
    const docName = name || newDocName.trim();
    if (!docName || !tripId) return;
    try {
      await addDocument.mutateAsync({ trip_id: tripId, document_name: docName });
      setNewDocName("");
    } catch {
      toast({ title: "Failed to add document", variant: "destructive" });
    }
  };

  // Simple currency conversion rates (static for now)
  const rates: Record<string, number> = { USD: 0.012, EUR: 0.011, GBP: 0.0095, THB: 0.41, INR: 1 };
  const converted = convAmount ? (parseFloat(convAmount) * (rates[convTo] || 1)).toFixed(2) : "";

  if (tripLoading) {
    return <div className="px-4 py-6"><div className="h-8 w-48 bg-muted animate-pulse rounded" /></div>;
  }

  if (!trip) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-muted-foreground">Trip not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/trips")}>Back to Trips</Button>
      </div>
    );
  }

  const packedCount = packingItems?.filter((i) => i.is_packed).length ?? 0;
  const totalPacking = packingItems?.length ?? 0;
  const readyDocs = documents?.filter((d) => d.is_ready).length ?? 0;
  const totalDocs = documents?.length ?? 0;

  const grouped = packingItems?.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>) ?? {};

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold font-heading">Prepare: {trip.destination}</h1>
          <p className="text-xs text-muted-foreground">
            {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="packing">
        <TabsList className="w-full">
          <TabsTrigger value="packing" className="flex-1 text-xs gap-1">
            <Package className="h-3 w-3" /> Packing ({packedCount}/{totalPacking})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 text-xs gap-1">
            <FileText className="h-3 w-3" /> Docs ({readyDocs}/{totalDocs})
          </TabsTrigger>
          <TabsTrigger value="info" className="flex-1 text-xs gap-1">
            <CloudSun className="h-3 w-3" /> Info
          </TabsTrigger>
        </TabsList>

        {/* Packing Tab */}
        <TabsContent value="packing" className="space-y-4 mt-3">
          {/* Add item */}
          <div className="flex gap-2">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {packingCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Add item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              className="flex-1 text-sm"
            />
            <Button size="icon" onClick={handleAddItem} disabled={addPacking.isPending || !newItem.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {totalPacking === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No items yet. Start adding your packing list!</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(grouped).map(([cat, items]) => {
              const catInfo = packingCategories.find((c) => c.id === cat);
              return (
                <div key={cat} className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {catInfo?.emoji} {catInfo?.label || cat}
                  </p>
                  {items!.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => togglePacking.mutate({ id: item.id, is_packed: !item.is_packed, trip_id: tripId! })}
                      className="flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-all hover:bg-muted/50"
                    >
                      {item.is_packed ? (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={`text-sm ${item.is_packed ? "line-through text-muted-foreground" : ""}`}>
                        {item.item_name}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-3">
          {/* Quick-add defaults */}
          {totalDocs === 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Quick-add common documents:</p>
                <div className="flex flex-wrap gap-2">
                  {defaultDocuments.map((doc) => (
                    <Badge
                      key={doc}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => handleAddDoc(doc)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> {doc}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Add document..."
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDoc()}
              className="flex-1 text-sm"
            />
            <Button size="icon" onClick={() => handleAddDoc()} disabled={addDocument.isPending || !newDocName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {documents?.map((doc) => (
            <button
              key={doc.id}
              onClick={() => toggleDocument.mutate({ id: doc.id, is_ready: !doc.is_ready, trip_id: tripId! })}
              className="flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-all hover:bg-muted/50"
            >
              {doc.is_ready ? (
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={`text-sm ${doc.is_ready ? "line-through text-muted-foreground" : ""}`}>
                {doc.document_name}
              </span>
            </button>
          ))}
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4 mt-3">
          {/* Weather */}
          {dest && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CloudSun className="h-4 w-4 text-primary" /> Weather in {dest.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Temperature</span>
                  <span className="text-sm font-medium">{dest.weather.temp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Condition</span>
                  <span className="text-sm font-medium">{dest.weather.condition}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daily Cost</span>
                  <span className="text-sm font-medium">{dest.costEstimate.daily}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Currency Converter */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-primary" /> Currency Converter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={convAmount}
                  onChange={(e) => setConvAmount(e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-muted-foreground">{convFrom}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-medium">
                  {converted || "—"}
                </div>
                <Select value={convTo} onValueChange={setConvTo}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(rates).filter((r) => r !== "INR").map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-muted-foreground">Approximate rates. Check live rates before travel.</p>
            </CardContent>
          </Card>

          {/* Local Tips */}
          {dest && dest.tips.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">💡 Local Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dest.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Prepare;
