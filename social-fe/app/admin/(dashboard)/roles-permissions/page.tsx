"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import CreateRoleDialog from "../../components/dialogs/role-form-dialog";
import { useRole } from "../../hooks/use-role";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "../../hooks/use-permissions";
import { PermissionManager } from "../../components/permission-manager";
import { Checkbox } from "@/components/ui/checkbox";
import RoleFormDialog from "../../components/dialogs/role-form-dialog";

export default function RolesManagementPage() {
  const [isOpenCreateRoleDialog, setIsOpenCreateRoleDialog] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentReady, setContentReady] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToEditInfo, setRoleToEditInfo] = useState<any | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

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
  const [limit] = useState(10);

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const handleSelectRole = (roleId: string, checked: boolean) => {
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

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params}`);
    setPage(newPage);

    setSelectedRoleIds([]);
  };

  const {
    roles: rolesResponse,
    deleteRolesMutation,
    isDeleting,
    isLoading,
  } = useRole(page, limit);
  const {
    permissionGroup,
    permissionGroupLoading,
    syncPermissionsMutation,
    isSyncing,
  } = usePermissions();

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

  return (
    <div className="w-full h-[85vh] overflow-hidden flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
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
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-sm rounded-md transition-all cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
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

      {/* Main Table */}
      <Card className="rounded-xl border bg-white py-0 shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-auto relative w-full">
            <table className="w-full border-collapse text-left min-w-200">
              <thead className="shadow-sm">
                <tr className="border-b-2 bg-gray-100 text-sm uppercase tracking-wider text-gray-500">
                  <th className="sticky top-0 z-10 w-12.5 whitespace-nowrap bg-gray-50/90 pl-6 pr-2 py-4 font-semibold backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    <Checkbox
                      aria-label="Select all roles"
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="sticky top-0 z-10 whitespace-nowrap bg-gray-50/90 px-6 py-4 font-semibold backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    Role Details
                  </th>
                  <th className="sticky top-0 z-10 whitespace-nowrap bg-gray-50/90 px-6 py-4 font-semibold backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    Attached Permissions
                  </th>
                  <th className="sticky top-0 z-10 whitespace-nowrap bg-gray-50/90 px-6 py-4 font-semibold backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    Users
                  </th>
                  <th className="sticky top-0 z-10 whitespace-nowrap bg-gray-50/90 px-6 py-4 text-right font-semibold backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading || permissionGroupLoading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b">
                      <td className="py-4 pl-6 pr-2 w-12.5">
                        <Skeleton className="h-4 w-4 rounded-xs" />
                      </td>
                      <td className="py-4 px-6">
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-3 w-64" />
                      </td>
                      <td className="py-4 px-6">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </td>
                      <td className="py-4 px-6">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Skeleton className="h-8 w-8 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : rolesList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 px-6 text-center text-gray-500"
                    >
                      No roles found.
                    </td>
                  </tr>
                ) : (
                  rolesList.map((role) => (
                    <tr
                      key={role.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 pl-6 pr-2 w-12.5">
                        <Checkbox
                          aria-label={`Select ${role.name}`}
                          checked={selectedRoleIds.includes(role.id)}
                          onCheckedChange={(checked: boolean) =>
                            handleSelectRole(role.id, checked)
                          }
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900 max-w-50 md:max-w-xs truncate">
                          {role.name}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 max-w-50 md:max-w-xs truncate">
                          {role.description}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {role._count?.rolePermissions ||
                            role.rolePermissions?.length ||
                            0}{" "}
                          policies
                        </Badge>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />{" "}
                          {role._count?.userRoles || 0}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 border-gray-200 hover:bg-gray-100 cursor-pointer"
                            title="Edit Role Info"
                            onClick={() => handleOpenEdit(role)}
                          >
                            <Pen className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
                            onClick={() => openEditSheet(role)}
                            title="Manage Permissions"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex shrink-0 flex-col sm:flex-row items-center justify-between border-t bg-white px-6 py-4 gap-4 z-20">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">
                {startItem}–{endItem}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> roles
            </p>
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) changePage(page - 1);
                    }}
                    className={
                      page <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === page}
                        onClick={(e) => {
                          e.preventDefault();
                          changePage(p);
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
            </Pagination>
          </div>
        </CardContent>
      </Card>

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
            {/* Search Bar */}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              disabled={isDeleting}
              onClick={() => {
                handleDelete();
                setIsDeleteDialogOpen(false);
              }}
            >
              {isDeleting ? "Deleting" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RoleFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        roleToEdit={roleToEditInfo}
      />
    </div>
  );
}
