import { ChevronLeft, ChevronRight, PageFirst, PageLast } from "@carbon/icons-react";
"use client";

import { Button } from "@onecms/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@onecms/ui/components/select";
import type { ReactNode } from "react";

const numberFormat = new Intl.NumberFormat();

export function TablePagination({
	page,
	totalPages,
	pageSize,
	total,
	onPageChange,
	onPageSizeChange,
	loading = false,
	meta,
}: {
	page: number;
	totalPages: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (size: number) => void;
	loading?: boolean;
	meta?: ReactNode;
}) {
	const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
	const rangeEnd = Math.min(page * pageSize, total);

	return (
		<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-2 py-2">
			{/* Left Side: Showing X to Y of Z rows */}
			<div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
				{meta ??
					(total === 0
						? "No results"
						: `Showing ${numberFormat.format(rangeStart)} to ${numberFormat.format(
								rangeEnd,
							)} of ${numberFormat.format(total)} rows`)}
			</div>

			{/* Right Side: Rows per page, Page X of Y, and Navigation Buttons */}
			<div className="flex items-center space-x-4 lg:space-x-6">
				<div className="flex items-center space-x-2">
					<p className="text-xs font-medium">Rows per page</p>
					<Select
						value={`${pageSize}`}
						onValueChange={(value) => {
							onPageSizeChange?.(Number(value));
						}}
					>
						<SelectTrigger className="!h-6 !w-[60px]">
							<SelectValue placeholder={pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 30, 40, 50].map((size) => (
								<SelectItem key={size} value={`${size}`}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				
				<div className="flex w-[80px] items-center justify-center text-xs font-medium tabular-nums">
					Page {page} of {Math.max(1, totalPages)}
				</div>
				
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						className="hidden h-6 w-6 p-0 lg:flex"
						onClick={() => onPageChange(1)}
						disabled={page <= 1}
					>
						<span className="sr-only">Go to first page</span>
						<PageFirst className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-6 w-6 p-0"
						onClick={() => onPageChange(page - 1)}
						disabled={page <= 1}
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-6 w-6 p-0"
						onClick={() => onPageChange(page + 1)}
						disabled={page >= totalPages}
					>
						<span className="sr-only">Go to next page</span>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="hidden h-6 w-6 p-0 lg:flex"
						onClick={() => onPageChange(totalPages)}
						disabled={page >= totalPages}
					>
						<span className="sr-only">Go to last page</span>
						<PageLast className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
