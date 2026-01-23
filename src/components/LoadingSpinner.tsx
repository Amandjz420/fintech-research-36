import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LoadingSpinnerProps {
  message?: string;
  showTimer?: boolean;
  expectedTime?: string;
}

const LoadingSpinner = ({ 
  message = "Loading dashboard data...",
  showTimer = true,
  expectedTime = "1-2 minutes"
}: LoadingSpinnerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!showTimer) return;
    
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center gap-6 text-center">
            {/* Spinner with timer */}
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              {showTimer && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{formatTime(elapsedTime)}</span>
                </div>
              )}
            </div>

            {/* Loading message */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">{message}</h3>
              <p className="text-sm text-muted-foreground">
                This page typically takes <span className="font-medium text-foreground">{expectedTime}</span> to load
              </p>
              <p className="text-xs text-muted-foreground">
                We're fetching 52,000+ records from the server. Please wait...
              </p>
            </div>

            {/* Status badges */}
            <div className="flex flex-col gap-2 items-center">
              <Badge variant="secondary" className="animate-pulse gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Request in progress
              </Badge>
              {showTimer && (
                <span className="text-xs text-muted-foreground">
                  Time elapsed: {formatTime(elapsedTime)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingSpinner;
