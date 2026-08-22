import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@onecms/ui/lib/utils";
import { Button } from "@onecms/ui/components/button";

export function BackHeader({ 
  desktopExpanded, 
  title, 
  icon: Icon, 
  backTo = "/dashboard" 
}: { 
  desktopExpanded: boolean; 
  title: string; 
  icon: any;
  backTo?: string;
}) {
  return (
    <div className={cn(
      "flex h-12 items-center tracking-tight transition-all duration-300 mx-1",
      desktopExpanded ? "justify-start gap-2 px-1" : "justify-center px-0"
    )}>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" asChild>
        <Link to={backTo}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">Back</span>
        </Link>
      </Button>
      <div className={cn(
        "flex items-center overflow-hidden transition-all duration-300 ease-in-out",
        desktopExpanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
      )}>
        <Icon className="mr-1.5 size-4 text-muted-foreground shrink-0" />
        <span className="truncate font-semibold text-sm">{title}</span>
      </div>
    </div>
  );
}
