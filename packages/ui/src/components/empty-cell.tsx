import { cn } from "@onecms/ui/lib/utils";

export function EmptyCellValue({ className }: { className?: string }) {
	return <span className={cn("text-muted-foreground", className)}>—</span>;
}
