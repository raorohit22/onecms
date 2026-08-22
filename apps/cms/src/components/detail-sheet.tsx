
import { ArrowLeft, X as Close } from "lucide-react";
import { Button } from "@onecms/ui/components/button";
import { Separator } from "@onecms/ui/components/separator";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@onecms/ui/components/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@onecms/ui/components/tooltip";
import { cn } from "@onecms/ui/lib/utils";
import { type ReactNode, useRef, useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@onecms/ui/components/sheet";

const GUTTER = "px-5";

export const SECTION_TITLE =
	"font-medium text-muted-foreground text-xs uppercase tracking-wider";

export const PROPERTY_ROW = "grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2";

export const PROPERTY_LABEL = "truncate text-muted-foreground text-xs";

const PROPERTY_CELL = "border border-transparent py-1";

export function DetailSheet({
	open,
	onOpenChange,
	className,
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	className?: string;
	children: ReactNode;
}) {
	const content = useRef<HTMLDivElement>(null);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				ref={content}
				side="right"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					content.current?.focus();
				}}
				className={cn("flex flex-col gap-0 p-0 sm:max-w-xl", className)}
			>
				{children}
			</SheetContent>
		</Sheet>
	);
}

export function DetailSheetHeader({
	media,
	title,
	description,
	note,
	actions,
	onBack,
	onClose,
}: {
	media?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	note?: ReactNode;
	actions?: ReactNode;
	onBack?: () => void;
	onClose: () => void;
}) {
	return (
		<SheetHeader className={cn("gap-0 border-b py-3 text-left", GUTTER)}>
			<div className="flex items-start gap-3">
				{onBack ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
								<ArrowLeft size={16} />
								<span className="sr-only">Back</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Back</TooltipContent>
					</Tooltip>
				) : null}

				{media}

				<div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
					<SheetTitle className="text-lg">
						{title}
					</SheetTitle>
					{description ? (
						<SheetDescription className="break-words">
							{description}
						</SheetDescription>
					) : null}
					{note ? (
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs">
							{note}
						</div>
					) : null}
				</div>

				<div className="flex shrink-0 items-center gap-1">
					{actions}
					{actions ? (
						<Separator orientation="vertical" className="mx-1 h-5" />
					) : null}
					{/* <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
						<Close size={16} />
						<span className="sr-only">Close</span>
					</Button> */}
				</div>
			</div>
		</SheetHeader>
	);
}

export function DetailSheetBody({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
			{children}
		</div>
	);
}

export function DetailSheetSection({
	title,
	action,
	className,
	children,
}: {
	title?: ReactNode;
	action?: ReactNode;
	className?: string;
	children: ReactNode;
}) {
	return (
		<section
			className={cn(
				"space-y-2 border-b py-4 last:border-b-0",
				GUTTER,
				className,
			)}
		>
			{title || action ? (
				<div className="flex h-5 items-center justify-between gap-3 mb-2">
					{title ? <h3 className={SECTION_TITLE}>{title}</h3> : <span />}
					{action}
				</div>
			) : null}
			{children}
		</section>
	);
}

export function DetailSheetMain({ children }: { children: ReactNode }) {
	return <div className="flex min-w-0 flex-1 flex-col">{children}</div>;
}

export function DetailSheetProperties({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={cn("flex flex-col", className)}>{children}</div>;
}

export function DetailSheetProperty({ label, value, children, className }: { label: ReactNode; value?: ReactNode; children?: ReactNode; className?: string }) {
	return (
		<div className={cn(PROPERTY_ROW, className)}>
			<div className={PROPERTY_LABEL}>{label}</div>
			<div className={PROPERTY_CELL}>{value || children}</div>
		</div>
	);
}
