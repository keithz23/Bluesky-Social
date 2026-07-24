import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ColumnDef } from "../interfaces/column.interface";
import { getPaginationRange } from "@/app/utils/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  tableName?: string;

  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  changePage: (page: number) => void;
  changeLimit: (limit: number) => void;

  enableSelection?: boolean;
  selectedIds?: string[];
  onSelectRow?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  isAllSelected?: boolean;

  getRowId?: (row: T) => string;
  disabledRowIds?: string[];
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading,
  tableName = "items",
  page,
  limit,
  totalItems,
  totalPages,
  changePage,
  changeLimit,
  enableSelection = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  isAllSelected = false,
  disabledRowIds = [],
  getRowId = (row) => row.id as string,
}: DataTableProps<T>) {
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <Card className="rounded-xl border bg-white py-0 shadow-sm flex-1 flex flex-col overflow-hidden">
      <CardContent className="p-0 flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-auto relative w-full">
          <table className="w-full border-collapse text-left min-w-200">
            {/* --- HEADER --- */}
            <thead className="shadow-sm">
              <tr className="border-b-2 bg-gray-100 text-sm uppercase tracking-wider text-gray-500">
                {enableSelection && (
                  <th className="sticky top-0 z-10 w-12.5 whitespace-nowrap bg-gray-50/90 pl-6 pr-2 py-4 font-semibold backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    <Checkbox
                      aria-label={`Select all ${tableName}`}
                      disabled={
                        data.length === 0 ||
                        data.every((row) =>
                          disabledRowIds.includes(getRowId(row)),
                        )
                      }
                      checked={isAllSelected}
                      onCheckedChange={onSelectAll}
                    />
                  </th>
                )}
                {columns.map((col, index) => (
                  <th
                    key={index}
                    className={`sticky top-0 z-10 whitespace-nowrap bg-gray-50/90 px-6 py-4 font-semibold backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${col.className || ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* --- BODY --- */}
            <tbody>
              {isLoading ? (
                // SKELETON
                Array.from({ length: limit }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`} className="border-b">
                    {enableSelection && (
                      <td className="py-4 pl-6 pr-2 w-12.5">
                        <Skeleton className="h-4 w-4 rounded-xs" />
                      </td>
                    )}
                    {columns.map((_, colIndex) => (
                      <td
                        key={`skeleton-col-${colIndex}`}
                        className="py-4 px-6"
                      >
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                // EMPTY STATE
                <tr>
                  <td
                    colSpan={columns.length + (enableSelection ? 1 : 0)}
                    className="py-10 px-6 text-center text-gray-500"
                  >
                    No {tableName} found.
                  </td>
                </tr>
              ) : (
                // DATA ROWS
                data.map((row) => {
                  const rowId = getRowId(row);
                  return (
                    <tr
                      key={rowId}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      {enableSelection && (
                        <td className="py-4 pl-6 pr-2 w-12.5">
                          <Checkbox
                            aria-label={`Select row`}
                            checked={selectedIds.includes(rowId)}
                            onCheckedChange={(checked: boolean) =>
                              onSelectRow && onSelectRow(rowId, checked)
                            }
                          />
                        </td>
                      )}

                      {columns.map((col, colIndex) => (
                        <td
                          key={colIndex}
                          className={`py-4 px-6 ${col.className || ""}`}
                        >
                          {col.cell
                            ? col.cell(row)
                            : col.accessorKey
                              ? (row[col.accessorKey] as React.ReactNode)
                              : null}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION --- */}
        <div className="flex shrink-0 flex-col sm:flex-row items-center justify-between border-t bg-white px-6 py-4 gap-4 z-20">
          <div className="flex items-center gap-x-2">
            <span className="text-nowrap">Rows per page</span>
            <Select
              value={String(limit)}
              onValueChange={(value) => {
                changeLimit(Number(value));
              }}
            >
              <SelectTrigger className="w-full max-w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) changePage(page - 1);
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {getPaginationRange(page, totalPages).map((p, idx) =>
              p === "dots" ? (
                <PaginationItem key={`dots-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault();
                      changePage(p as number);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) changePage(page + 1);
                }}
                className={
                  page >= totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </div>
      </CardContent>
    </Card>
  );
}
