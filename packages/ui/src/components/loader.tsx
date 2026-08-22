import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils.js';

interface GlobalLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function GlobalLoader({ 
  text = 'Loading...', 
  fullScreen = false, 
  size = 'md',
  className,
  ...props 
}: GlobalLoaderProps) {
  
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-8',
    lg: 'size-12'
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className={cn("absolute rounded-full border border-primary/30 animate-ping", sizeClasses[size], "opacity-50")} />
        {/* Spinning icon */}
        <Loader2 className={cn("text-primary animate-spin", sizeClasses[size])} />
      </div>
      {text && (
        <p className={cn("text-muted-foreground font-medium tracking-wide", textClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className={cn("fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", className)} 
        {...props}
      >
        {content}
      </div>
    );
  }

  return (
    <div 
      className={cn("flex w-full items-center justify-center p-8", className)} 
      {...props}
    >
      {content}
    </div>
  );
}

export function Loader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0 size-4", className)} {...props}>
      <div className="absolute rounded-full border border-current opacity-50 animate-ping h-full w-full" />
      <Loader2 className="animate-spin h-full w-full text-current" />
    </div>
  );
}
