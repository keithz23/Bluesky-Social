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
import { useRules } from "../../hooks/use-rules";

import { Rule, RuleSeverity } from "../../interfaces/rule.interface";
import { Keyword, KeywordAction } from "../../interfaces/keyword.interface";
import { useKeywords, useKeywordsMutation } from "../../hooks/use-keywords";
import KeywordFormDialog from "../../components/dialogs/keyword-form-dialog";

export default function KeywordsManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<string[]>([]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  const [keywordToEditInfo, setKeywordToEditInfo] = useState<Rule | null>(null);

  const searchParam = searchParams.get("search") || "";

  const actionFilter = (searchParams.get("action") || "all") as
    KeywordAction | "all";
  const ruleFilter = searchParams.get("ruleId") || "";
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
    searchParam !== "" || actionFilter !== "all" || ruleFilter || "";

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("action");
    params.delete("ruleId");
    params.set("page", "1");
    router.push(`${pathname}?${params}`);

    setPage(1);
    setSelectedKeywordIds([]);
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
    setSelectedKeywordIds([]);
    scrollToTop();
  };

  const changeLimit = (newLimit: number) => {
    updateURLParams("limit", String(newLimit));
    setLimit(newLimit);
    setPage(1);
    setSelectedKeywordIds([]);
    scrollToTop();
  };

  const { data: rulesResponse } = useRules(
    page,
    limit,
    undefined,
    undefined,
    undefined,
    true,
  );

  const { data: keywordsResponse, isLoading } = useKeywords(
    page,
    limit,
    searchParam,
    actionFilter,
    ruleFilter,
  );

  const { deleteKeywordsMutation, isDeleting } = useKeywordsMutation();

  const rulesList: Rule[] = rulesResponse?.data ?? [];
  const keywordsList: Keyword[] = keywordsResponse?.data ?? [];
  const meta = keywordsResponse?.meta ?? { total: 0, totalPages: 1 };
  const totalItems = meta.total;
  const totalPages = meta.totalPages;

  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  const handleSelectKeyword = (keywordId: string, checked: boolean) => {
    if (checked) setSelectedKeywordIds((prev) => [...prev, keywordId]);
    else setSelectedKeywordIds((prev) => prev.filter((id) => id !== keywordId));
  };

  const handleSelectAll = (checked: boolean) => {
    const currentPageIds = keywordsList.map((r) => r.id);
    if (checked) {
      setSelectedKeywordIds((prev) =>
        Array.from(new Set([...prev, ...currentPageIds])),
      );
    } else {
      setSelectedKeywordIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );
    }
  };

  const isAllSelected =
    keywordsList.length > 0 &&
    keywordsList.every((r) => selectedKeywordIds.includes(r.id));

  const getKeywordActionBadge = (keywordAction: KeywordAction) => {
    switch (keywordAction) {
      case "AUTO_HIDE":
        return (
          <Badge className="bg-red-600 hover:bg-red-700 font-normal">
            Auto Hide
          </Badge>
        );
      case "WARN":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 font-normal">
            Warn
          </Badge>
        );
      case "FLAG":
      default:
        return (
          <Badge className="bg-slate-500 hover:bg-slate-600 font-normal">
            Flag
          </Badge>
        );
    }
  };

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
      header: "Keyword Details",
      cell: (keyword: Keyword) => (
        <>
          <div className="font-semibold text-gray-900 max-w-50 md:max-w-xs truncate">
            {keyword.word}
          </div>
        </>
      ),
    },
    {
      header: "Keyword Rule",
      cell: (keyword: Keyword) => (
        <>
          <div className="font-semibold text-gray-900 max-w-50 md:max-w-xs truncate">
            {keyword.rule.title}
          </div>
          <div className="text-sm text-gray-500 mt-1 max-w-62.5 md:max-w-sm truncate">
            {keyword.rule.description}
          </div>
        </>
      ),
    },
    {
      header: "Rule Severity",
      cell: (keyword: Keyword) => getSeverityBadge(keyword.rule.severity),
    },
    {
      header: "Action",
      className: "whitespace-nowrap",
      cell: (keyword) => getKeywordActionBadge(keyword.action),
    },
    {
      header: "Actions",
      className: "text-right whitespace-nowrap",
      cell: (keyword) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 border-gray-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              setKeywordToEditInfo(keyword);
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
            Keywords Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage community keyword, action
          </p>
        </div>
        <div className="flex items-center gap-x-3">
          {selectedKeywordIds.length > 0 && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto shadow-sm rounded-md transition-all cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash className="w-4 h-4 mr-2 shrink-0" /> Delete (
              {selectedKeywordIds.length})
            </Button>
          )}
          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer rounded-md"
            onClick={() => {
              setKeywordToEditInfo(null);
              setIsFormDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2 shrink-0" /> Create Keyword
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-5 shrink-0">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <Select
            value={actionFilter}
            onValueChange={(val) => updateURLParams("action", val)}
          >
            <SelectTrigger className="w-full sm:w-36 bg-white">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="FLAG">Flag</SelectItem>
                <SelectItem value="WARN">Warn</SelectItem>
                <SelectItem value="AUTO_HIDE">Auto hide</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={ruleFilter}
            onValueChange={(val) => updateURLParams("ruleId", val)}
          >
            <SelectTrigger className="w-full sm:w-36 bg-white">
              <SelectValue placeholder="Rule" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Rules</SelectItem>
                {rulesList.map((rl) => (
                  <SelectItem key={rl.id} value={rl.id}>
                    {rl.title}
                  </SelectItem>
                ))}
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
          of <span className="font-medium">{totalItems}</span> keywords
        </p>
      </div>

      {/* DATA TABLE */}
      <DataTable
        tableName="keywords"
        data={keywordsList}
        columns={columns}
        isLoading={isLoading}
        page={page}
        limit={limit}
        totalItems={totalItems}
        totalPages={totalPages}
        changePage={changePage}
        changeLimit={changeLimit}
        enableSelection={true}
        selectedIds={selectedKeywordIds}
        isAllSelected={isAllSelected}
        onSelectRow={handleSelectKeyword}
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
              Are you sure you want to delete {selectedKeywordIds.length}{" "}
              keyword(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                deleteKeywordsMutation.mutate(
                  { keywordIds: selectedKeywordIds },
                  {
                    onSuccess: () => setSelectedKeywordIds([]),
                  },
                );
                setIsDeleteDialogOpen(false);
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* FORM DIALOG */}
      <KeywordFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        keywordToEdit={keywordToEditInfo}
      />
    </div>
  );
}
