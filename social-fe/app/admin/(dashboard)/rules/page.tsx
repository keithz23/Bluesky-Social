"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  ShieldAlert,
  Trash,
  Pen,
  RotateCcw,
  Scale,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DataTable from "../../components/table-data";
import { ColumnDef } from "../../interfaces/column.interface";
import RuleFormDialog from "../../components/dialogs/rule-form-dialog";
import { useRules, useRuleMutations } from "../../hooks/use-rules";

import { Rule, RuleSeverity } from "../../interfaces/rule.interface";

export default function RulesManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  const [ruleToEditInfo, setRuleToEditInfo] = useState<Rule | null>(null);

  const searchParam = searchParams.get("search") || "";

  const severityFilter = (searchParams.get("severity") || "all") as
    RuleSeverity | "all";
  const statusFilter = (searchParams.get("status") || "all") as
    "active" | "inactive" | "all";

  const [searchTerm, setSearchTerm] = useState(searchParam);

  const updateURLParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    router.push(`${pathname}?${params}`);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      updateURLParams("search", searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const hasActiveFilters =
    searchParam !== "" || severityFilter !== "all" || statusFilter !== "all";

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("severity");
    params.delete("status");
    params.set("page", "1");
    router.push(`${pathname}?${params}`);

    setPage(1);
    setSelectedRuleIds([]);
    setSearchTerm("");
    scrollToTop();
  };

  const scrollToTop = () => {
    const tableContainer = document.querySelector(".table-scroll-container");
    if (tableContainer) tableContainer.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changePage = (newPage: number) => {
    updateURLParams("page", String(newPage));
    setPage(newPage);
    setSelectedRuleIds([]);
    scrollToTop();
  };

  const changeLimit = (newLimit: number) => {
    updateURLParams("limit", String(newLimit));
    setLimit(newLimit);
    setPage(1);
    setSelectedRuleIds([]);
    scrollToTop();
  };

  const { data: rulesResponse, isLoading } = useRules(
    page,
    limit,
    searchParam,
    severityFilter,
    statusFilter,
  );

  const { deleteRulesMutation } = useRuleMutations();
  const isDeleting = deleteRulesMutation.isPending;

  const rulesList: Rule[] = rulesResponse?.data ?? [];
  const meta = rulesResponse?.meta ?? { total: 0, totalPages: 1 };
  const totalItems = meta.total;
  const totalPages = meta.totalPages;

  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  const handleSelectRule = (ruleId: string, checked: boolean) => {
    if (checked) setSelectedRuleIds((prev) => [...prev, ruleId]);
    else setSelectedRuleIds((prev) => prev.filter((id) => id !== ruleId));
  };

  const handleSelectAll = (checked: boolean) => {
    const currentPageIds = rulesList.map((r) => r.id);
    if (checked) {
      setSelectedRuleIds((prev) =>
        Array.from(new Set([...prev, ...currentPageIds])),
      );
    } else {
      setSelectedRuleIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );
    }
  };

  const isAllSelected =
    rulesList.length > 0 &&
    rulesList.every((r) => selectedRuleIds.includes(r.id));

  const getSeverityBadge = (severity: RuleSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <Badge className="bg-red-600 hover:bg-red-700 font-normal">
            Critical
          </Badge>
        );
      case "HIGH":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 font-normal">
            High
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-normal">
            Medium
          </Badge>
        );
      case "LOW":
      default:
        return (
          <Badge className="bg-slate-500 hover:bg-slate-600 font-normal">
            Low
          </Badge>
        );
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Rule Details",
      cell: (rule) => (
        <>
          <div className="font-semibold text-gray-900 max-w-50 md:max-w-xs truncate">
            {rule.title}
          </div>
          <div className="text-sm text-gray-500 mt-1 max-w-62.5 md:max-w-sm truncate">
            {rule.description}
          </div>
        </>
      ),
    },
    {
      header: "Severity",
      className: "whitespace-nowrap",
      cell: (rule) => getSeverityBadge(rule.severity),
    },
    {
      header: "Status",
      className: "whitespace-nowrap",
      cell: (rule) => (
        <Badge
          variant={rule.isActive ? "default" : "secondary"}
          className={
            rule.isActive
              ? "bg-green-100 text-green-700 border-green-200 font-normal"
              : "font-normal"
          }
        >
          {rule.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Order",
      className: "whitespace-nowrap",
      cell: (rule) => (
        <span className="text-gray-600 font-medium">{rule.displayOrder}</span>
      ),
    },
    {
      header: "Actions",
      className: "text-right whitespace-nowrap",
      cell: (rule) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 border-gray-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              setRuleToEditInfo(rule);
              setIsFormDialogOpen(true);
            }}
          >
            <Pen className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-[85vh] overflow-hidden flex flex-col bg-gray-50/50">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-600 shrink-0" />
            Rules Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage community rules, report criteria, and their severity.
          </p>
        </div>
        <div className="flex items-center gap-x-3">
          {selectedRuleIds.length > 0 && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto shadow-sm rounded-md transition-all cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash className="w-4 h-4 mr-2 shrink-0" /> Delete (
              {selectedRuleIds.length})
            </Button>
          )}
          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer rounded-md"
            onClick={() => {
              setRuleToEditInfo(null);
              setIsFormDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2 shrink-0" /> Create Rule
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-5 shrink-0">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <Select
            value={severityFilter}
            onValueChange={(val) => updateURLParams("severity", val)}
          >
            <SelectTrigger className="w-full sm:w-36 bg-white">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(val) => updateURLParams("status", val)}
          >
            <SelectTrigger className="w-full sm:w-36 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Clear
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Showing{" "}
          <span className="font-medium">
            {startItem}–{endItem}
          </span>{" "}
          of <span className="font-medium">{totalItems}</span> rules
        </p>
      </div>

      {/* DATA TABLE */}
      <DataTable
        tableName="rules"
        data={rulesList}
        columns={columns}
        isLoading={isLoading}
        page={page}
        limit={limit}
        totalItems={totalItems}
        totalPages={totalPages}
        changePage={changePage}
        changeLimit={changeLimit}
        enableSelection={true}
        selectedIds={selectedRuleIds}
        isAllSelected={isAllSelected}
        onSelectRow={handleSelectRule}
        onSelectAll={handleSelectAll}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRuleIds.length} rule(s)?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                deleteRulesMutation.mutate(selectedRuleIds, {
                  onSuccess: () => setSelectedRuleIds([]),
                });
                setIsDeleteDialogOpen(false);
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* FORM DIALOG */}
      <RuleFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        ruleToEdit={ruleToEditInfo}
      />
    </div>
  );
}
