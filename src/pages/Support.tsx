import { useState } from "react";
import { Mail, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Shield, CreditCard, Map, Smartphone, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface FAQ {
  question: string;
  answer: string;
  icon: React.ElementType;
}

const faqs: FAQ[] = [
  {
    question: "What is Margdarshi?",
    answer: "Margdarshi is an AI-powered travel planner that helps you discover destinations, create personalized itineraries, and plan your perfect trip to India. The name 'Margdarshi' means 'guide' in Hindi — we guide you through every step of your travel journey!",
    icon: Globe,
  },
  {
    question: "How does the AI itinerary generation work?",
    answer: "When you create a trip, our AI analyzes your destination, budget, number of travelers, and preferences to generate a day-by-day itinerary with activities, estimated costs, and photos. The AI uses NVIDIA's language models to create personalized, practical travel plans.",
    icon: MessageCircle,
  },
  {
    question: "Is Margdarshi free to use?",
    answer: "Yes! Margdarshi is completely free to use. You can plan unlimited trips, chat with our AI coach, discover destinations, and use all features at no cost. We believe everyone deserves a great travel planning experience.",
    icon: CreditCard,
  },
  {
    question: "How do I use the AI Coach?",
    answer: "Go to the 'Coach' tab in the bottom navigation. You can ask the AI any travel-related question — from 'Best time to visit Goa?' to 'Plan a budget trip for 5 days'. The AI will give you detailed, personalized advice based on your preferences.",
    icon: MessageCircle,
  },
  {
    question: "Can I use Margdarshi offline?",
    answer: "Margdarshi works best with an internet connection for AI features. However, your saved trips and itineraries are cached locally, so you can view them offline. The currency converter also works offline with cached exchange rates.",
    icon: Smartphone,
  },
  {
    question: "How does the Map feature work?",
    answer: "On any trip itinerary, switch to 'Map View' to see all your activities pinned on an interactive map. Tap any location to get directions via Google Maps. You can also explore 'Nearby Attractions' to discover temples, parks, and museums near your destination.",
    icon: Map,
  },
  {
    question: "Is my data safe?",
    answer: "Absolutely. We use Supabase (built on PostgreSQL) for secure data storage with row-level security. Your personal information and trip data are protected with enterprise-grade security. We never share your data with third parties.",
    icon: Shield,
  },
  {
    question: "How do I change the app theme?",
    answer: "Go to Profile → Appearance section. You can choose between Light mode, Dark mode, or System (which follows your device's theme setting). Your preference is saved and persists across sessions.",
    icon: Smartphone,
  },
  {
    question: "Can I share my trip itinerary?",
    answer: "Yes! On the itinerary page, you can share your trip details with friends and family. In the mobile app, this uses the native share sheet to share via WhatsApp, email, or any other app on your device.",
    icon: Globe,
  },
  {
    question: "How accurate is the currency converter?",
    answer: "The currency converter fetches live exchange rates from the ExchangeRate API and caches them for 1 hour. It supports 40+ currencies worldwide. The rates are approximate — always check with your bank for exact conversion rates before travel.",
    icon: CreditCard,
  },
];

const FAQItem = ({ faq }: { faq: FAQ }) => {
  const [open, setOpen] = useState(false);
  const Icon = faq.icon;

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left rounded-lg border p-4 transition-all hover:bg-muted/50"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-1.5 mt-0.5">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium pr-2">{faq.question}</p>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </div>
          {open && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {faq.answer}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

const Support = () => (
  <div className="px-4 py-6 space-y-6 pb-24">
    {/* Header */}
    <div>
      <h1 className="text-2xl font-bold font-heading">Help & Support</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Find answers to common questions or reach out to us
      </p>
    </div>

    {/* Contact Card */}
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">Need help? Email us!</p>
            <p className="text-xs text-muted-foreground">We typically respond within 24 hours</p>
          </div>
        </div>
        <a href="mailto:aadarshjha259@gmail.com">
          <Button className="w-full gap-2" variant="default">
            <Mail className="h-4 w-4" />
            aadarshjha259@gmail.com
          </Button>
        </a>
      </CardContent>
    </Card>

    <Separator />

    {/* FAQs */}
    <div>
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold font-heading">Frequently Asked Questions</h2>
      </div>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <FAQItem key={i} faq={faq} />
        ))}
      </div>
    </div>

    <Separator />

    {/* App Info */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">About Margdarshi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Version</span>
          <span className="font-medium">1.0.0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Platform</span>
          <span className="font-medium">Web + Android</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">AI Engine</span>
          <span className="font-medium">NVIDIA NIM</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Support Email</span>
          <a href="mailto:aadarshjha259@gmail.com" className="font-medium text-primary hover:underline">
            aadarshjha259@gmail.com
          </a>
        </div>
      </CardContent>
    </Card>

    {/* Footer */}
    <p className="text-center text-[10px] text-muted-foreground">
      Made with ❤️ in India · © 2026 Margdarshi
    </p>
  </div>
);

export default Support;
