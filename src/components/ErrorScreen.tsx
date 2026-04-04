import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorScreen = ({ message = "Something went wrong", onRetry }: ErrorScreenProps) => (
  <div className="flex min-h-[60vh] items-center justify-center px-4">
    <div className="flex flex-col items-center gap-4 text-center">
      <AlertTriangle className="h-12 w-12 text-secondary" />
      <div>
        <h2 className="text-lg font-bold font-heading">Oops!</h2>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </div>
  </div>
);

export default ErrorScreen;
