"use client";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  Shield,
  Users,
  CheckCircle2,
  Pen,
  ShieldAlert,
  Trash,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { useRole } from "../../hooks/use-role";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePermissions } from "../../hooks/use-permissions";
import { PermissionManager } from "../../components/permission-manager";
import RoleFormDialog from "../../components/dialogs/role-form-dialog";
import DataTable from "../../components/table-data";
import { ColumnDef } from "../../interfaces/column.interface";
import { useAuthStore } from "@/app/store/use-auth.store";

export default function RolesManagementPage() {
  const currentUserRoles = useAuthStore((state) => state.roles);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentReady, setContentReady] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToEditInfo, setRoleToEditInfo] = useState<any | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  const isOwnRole = (role: any) => (currentUserRoles ?? []).includes(role.name);

  const handleOpenCreate = () => {
    setRoleToEditInfo(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEdit = (role: any) => {
    setRoleToEditInfo(role);
    setIsFormDialogOpen(true);
  };

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // --- LOGIC SEARCH & FILTER CHO ROLE ---
  const roleSearchParam = searchParams.get("search") || "";
  const sortFilter = searchParams.get("sort") || "all";

  const [roleSearchTerm, setRoleSearchTerm] = useState(roleSearchParam);

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
      updateURLParams("search", roleSearchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [roleSearchTerm]);

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const handleSelectRole = (roleId: string, checked: boolean) => {
    const role = rolesList.find((r) => r.id === roleId);
    if (role && isOwnRole(role)) return;

    if (checked) {
      setSelectedRoleIds((prev) => [...prev, roleId]);
    } else {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    const currentPageRoleIds = rolesList.map((role) => role.id);

    if (checked) {
      setSelectedRoleIds((prev) =>
        Array.from(new Set([...prev, ...currentPageRoleIds])),
      );
    } else {
      setSelectedRoleIds((prev) =>
        prev.filter((id) => !currentPageRoleIds.includes(id)),
      );
    }
  };

  const scrollToTop = () => {
    const tableContainer = document.querySelector(".table-scroll-container");
    if (tableContainer) {
      tableContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const changePage = (newPage: number) => {
    updateURLParams("page", String(newPage));
    setPage(newPage);
    setSelectedRoleIds([]);
    scrollToTop();
  };

  const changeLimit = (newLimit: number) => {
    updateURLParams("limit", String(newLimit));
    setLimit(newLimit);
    setPage(1);
    setSelectedRoleIds([]);
    scrollToTop();
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("sort");
    params.set("page", "1");
    router.push(`${pathname}?${params}`);

    setPage(1);
    setSelectedRoleIds([]);
    setRoleSearchTerm("");
    scrollToTop();
  };

  const hasActiveFilters = roleSearchParam !== "" || sortFilter !== "all";

  const {
    roles: rolesResponse,
    deleteRolesMutation,
    isDeleting,
    isLoading,
  } = useRole(page, limit, roleSearchParam, sortFilter);

  const { permissionGroup, syncPermissionsMutation, isSyncing } =
    usePermissions();

  const rolesList = (rolesResponse?.data ?? []) as any[];
  const meta = rolesResponse?.meta ?? { total: 0, totalPages: 1 };

  const totalItems = meta.total;
  const totalPages = meta.totalPages;

  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  const openEditSheet = (role: any) => {
    let flatPermissionIds: string[] = [];

    if (role.rolePermissions && Array.isArray(role.rolePermissions)) {
      flatPermissionIds = role.rolePermissions.map((item: any) => {
        if (typeof item === "string") return item;
        if (item.permissionId) return item.permissionId;
        if (item.id) return item.id;
        return item;
      });
    }

    setEditingRole({
      ...role,
      rolePermissions: flatPermissionIds,
    });

    setSearchQuery("");
    setContentReady(false);
    setIsSheetOpen(true);
  };

  const togglePermission = (permId: string) => {
    setEditingRole((prev: any) => {
      if (!prev) return prev;
      const isAttached = prev.rolePermissions.includes(permId);
      return {
        ...prev,
        rolePermissions: isAttached
          ? prev.rolePermissions.filter((id: string) => id !== permId)
          : [...prev.rolePermissions, permId],
      };
    });
  };

  const togglePermissionGroup = (permIds: string[], isSelected: boolean) => {
    setEditingRole((prev: any) => {
      if (!prev) return prev;
      let newPermissions = [...(prev.rolePermissions || [])];

      if (isSelected) {
        permIds.forEach((id) => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id);
          }
        });
      } else {
        newPermissions = newPermissions.filter((id) => !permIds.includes(id));
      }

      return {
        ...prev,
        rolePermissions: newPermissions,
      };
    });
  };

  const handleSaveChanges = () => {
    if (!editingRole) return;
    syncPermissionsMutation.mutate({
      roleId: editingRole.id,
      permissionIds: editingRole.rolePermissions,
    });
    setIsSheetOpen(false);
  };

  const filteredPermissionGroups = useMemo(() => {
    if (!Array.isArray(permissionGroup)) return [];
    if (!searchQuery.trim()) return permissionGroup;

    const query = searchQuery.toLowerCase();

    return permissionGroup
      .map((group: any) => {
        const filteredPerms = group.permissions.filter(
          (p: any) =>
            (p.displayName && p.displayName.toLowerCase().includes(query)) ||
            p.name.toLowerCase().includes(query) ||
            p.action.toLowerCase().includes(query) ||
            p.resource.toLowerCase().includes(query),
        );
        return { ...group, permissions: filteredPerms };
      })
      .filter((group: any) => group.permissions.length > 0);
  }, [permissionGroup, searchQuery]);

  const isAllSelected =
    rolesList.length > 0 &&
    rolesList.every((role) => selectedRoleIds.includes(role.id));

  const handleDelete = () => {
    deleteRolesMutation.mutate(
      {
        roleIds: selectedRoleIds,
      },
      {
        onSuccess: () => {
          setSelectedRoleIds([]);
        },
      },
    );
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Role Details",
      cell: (role) => (
        <>
          <div className="font-semibold text-gray-900 max-w-50 md:max-w-xs truncate flex items-center gap-2">
            {role.name}
            {isOwnRole(role) && (
              <Badge variant="outline" className="text-xs shrink-0 bg-gray-50">
                Your role
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1 max-w-50 md:max-w-xs truncate">
            {role.description}
          </div>
        </>
      ),
    },
    {
      header: "Attached Permissions",
      className: "whitespace-nowrap",
      cell: (role) => (
        <Badge
          variant="secondary"
          className="bg-blue-50 text-blue-700 border-blue-200 font-normal"
        >
          {role._count?.rolePermissions || role.rolePermissions?.length || 0}{" "}
          policies
        </Badge>
      ),
    },
    {
      header: "Users",
      className: "whitespace-nowrap",
      cell: (role) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-4 h-4" /> {role._count?.userRoles || 0}
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-right whitespace-nowrap",
      cell: (role) => {
        const disabled = isOwnRole(role);
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-200 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleOpenEdit(role)}
              disabled={disabled}
              title={
                disabled ? "Cannot edit your current role " : "Edit Role Info"
              }
            >
              <Pen className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
              onClick={() => openEditSheet(role)}
              disabled={disabled}
              title={
                disabled
                  ? "Cannot edit permissions of your current role"
                  : "Manage Permissions"
              }
            >
              <ShieldAlert className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full h-[85vh] overflow-hidden flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600 shrink-0" />
            Roles Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Create roles and attach pre-defined permissions to them.
          </p>
        </div>
        <div className="flex items-center gap-x-3">
          {selectedRoleIds.length > 0 && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto shadow-sm rounded-md transition-all cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash className="w-4 h-4 mr-2 shrink-0" /> Delete (
              {selectedRoleIds.length})
            </Button>
          )}

          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer rounded-md"
            onClick={handleOpenCreate}
          >
            <Plus className="w-4 h-4 mr-2 shrink-0" /> Create New Role
          </Button>
        </div>
      </div>

      {/* --- THANH CÔNG CỤ TÌM KIẾM & LỌC --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-5 shrink-0">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search role name..."
              value={roleSearchTerm}
              onChange={(e) => setRoleSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          {/* FILTER: SORT BY */}
          <Select
            value={sortFilter}
            onValueChange={(val) => {
              updateURLParams("sort", val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48 bg-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort By</SelectLabel>
                <SelectItem value="all">Default (Newest)</SelectItem>
                <SelectItem value="asc">Name (A-Z)</SelectItem>
                <SelectItem value="desc">Name (Z-A)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* CLEAR FILTERS BUTTON */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Showing{" "}
          <span className="font-medium">
            {startItem}–{endItem}
          </span>{" "}
          of <span className="font-medium">{totalItems}</span> roles
        </p>
      </div>

      {/* Main Table */}
      <DataTable
        tableName="roles"
        data={rolesList}
        columns={columns}
        isLoading={isLoading}
        page={page}
        limit={limit}
        totalItems={totalItems}
        totalPages={totalPages}
        changePage={changePage}
        changeLimit={changeLimit}
        enableSelection={true}
        selectedIds={selectedRoleIds}
        isAllSelected={isAllSelected}
        onSelectRow={handleSelectRole}
        onSelectAll={handleSelectAll}
        disabledRowIds={rolesList.filter(isOwnRole).map((r) => r.id)}
      />

      {/* Permissions Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          className="w-full sm:max-w-md md:max-w-2xl flex flex-col p-0 border-l-0 shadow-lg"
          onAnimationEnd={() => setContentReady(true)}
        >
          <SheetHeader className="px-6 py-5 border-b bg-gray-50/50 text-left">
            <SheetTitle className="text-xl font-bold text-gray-900">
              {editingRole?.name}
            </SheetTitle>
            <SheetDescription>
              Manage permissions attached to this role
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-5 bg-gray-50/30">
            {/* Search Bar for Permissions */}
            <div className="relative shrink-0">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search available permissions..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {editingRole && contentReady ? (
              filteredPermissionGroups.length > 0 ? (
                <PermissionManager
                  permissionGroups={filteredPermissionGroups}
                  rolePermissions={editingRole.rolePermissions || []}
                  onToggle={togglePermission}
                  onToggleGroup={togglePermissionGroup}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Search className="w-8 h-8 text-gray-300 mb-3" />
                  <p>No permissions found matching "{searchQuery}"</p>
                </div>
              )
            ) : (
              <div className="flex-1 min-h-0" />
            )}
          </div>

          <SheetFooter className="px-6 py-4 border-t bg-white mt-auto flex sm:justify-between items-center w-full">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              {editingRole?.rolePermissions?.length || 0} attached
            </span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSaveChanges}
              >
                {isSyncing ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the{" "}
              <strong>{selectedRoleIds.length}</strong> selected role(s)? This
              action cannot be undone, and users currently assigned to these
              roles may lose their access privileges.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
                setIsDeleteDialogOpen(false);
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Form Dialog */}
      <RoleFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        roleToEdit={roleToEditInfo}
      />
    </div>
  );
}
