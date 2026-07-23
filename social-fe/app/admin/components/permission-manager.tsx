import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronDownIcon } from "lucide-react";
import {
  PermissionGroups,
  Permissions,
  RolePermissions,
} from "../interfaces/permission.interface";

interface PermissionManagerProps {
  permissionGroups: PermissionGroups[];
  rolePermissions: string[]; // (Hoặc RolePermissions nếu bạn định nghĩa alias là string[])
  onToggle: (id: string) => void;
  // THÊM PROPS MỚI: Xử lý bật/tắt toàn bộ group
  onToggleGroup: (ids: string[], isSelected: boolean) => void;
}

export function PermissionManager({
  permissionGroups,
  rolePermissions,
  onToggle,
  onToggleGroup,
}: PermissionManagerProps) {
  return (
    <>
      {permissionGroups.map((group: PermissionGroups) => {
        // Kiểm tra xem TOÀN BỘ quyền trong group này đã được tick chưa?
        const isAllSelected =
          group.permissions.length > 0 &&
          group.permissions.every((p) => rolePermissions?.includes(p.id));

        return (
          <Collapsible
            key={group.id}
            className="rounded-lg border bg-white shadow-sm data-[state=open]:bg-gray-50/50"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex justify-between items-center p-4 h-auto hover:bg-transparent"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-gray-900">
                    {group.name}
                  </span>
                  {group.description && (
                    <span className="text-sm text-gray-500 font-normal mt-0.5">
                      {group.description}
                    </span>
                  )}
                </div>
                <ChevronDownIcon className="h-5 w-5 text-gray-400 transition-transform duration-200 data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex flex-col gap-2 p-4 pt-2 border-t">
              {/* === NÚT CHỌN TẤT CẢ (SELECT ALL) === */}
              {group.permissions.length > 1 && (
                <div className="flex items-center justify-between space-x-2 rounded-md border border-blue-100 bg-blue-50 p-3 mb-2">
                  <Label
                    htmlFor={`group-${group.id}-all`}
                    className="text-sm font-semibold text-blue-700 cursor-pointer"
                  >
                    Select All in {group.name}
                  </Label>
                  <Switch
                    id={`group-${group.id}-all`}
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                      // Gom toàn bộ ID của group này thành 1 mảng và gửi lên
                      const allIds = group.permissions.map((p) => p.id);
                      onToggleGroup(allIds, checked);
                    }}
                  />
                </div>
              )}
              {/* ================================== */}

              {group.permissions.map((permission: Permissions) => {
                const hasPermission = rolePermissions?.includes(permission.id);

                return (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between space-x-2 rounded-md border border-gray-100 p-3 bg-white"
                  >
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`perm-${permission.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {permission.displayName || permission.name}
                      </Label>
                      <span className="text-xs text-gray-400 mt-0.5">
                        {permission.action.toUpperCase()} •{" "}
                        {permission.resource}
                      </span>
                    </div>

                    <Switch
                      id={`perm-${permission.id}`}
                      checked={hasPermission}
                      onCheckedChange={() => onToggle(permission.id)}
                    />
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </>
  );
}
