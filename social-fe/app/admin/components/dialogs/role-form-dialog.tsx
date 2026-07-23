import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "../../hooks/use-role";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required.")
    .max(50, "Role name must be 50 characters or less."),

  description: z
    .string()
    .trim()
    .max(100, "Description must be 100 characters or less."),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleToEdit?: { id: string; name: string; description: string } | null;
}

export default function RoleFormDialog({
  open,
  onOpenChange,
  roleToEdit,
}: RoleFormDialogProps) {
  const isEditMode = !!roleToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { createRoleMutation, isCreating, updateRoleMutation, isUpdating } =
    useRole();

  useEffect(() => {
    if (open) {
      if (roleToEdit) {
        reset({
          name: roleToEdit.name,
          description: roleToEdit.description || "",
        });
      } else {
        reset({ name: "", description: "" });
      }
    }
  }, [open, roleToEdit, reset]);
  // ====================================================================

  const closeAndReset = () => {
    reset({ name: "", description: "" });
    onOpenChange(false);
  };

  const onSubmit = (data: RoleFormValues) => {
    if (isEditMode && roleToEdit) {
      updateRoleMutation.mutate(
        {
          id: roleToEdit.id,
          payload: {
            name: data.name,
            description: data.description,
          },
        },
        {
          onSuccess: () => closeAndReset(),
        },
      );
    } else {
      createRoleMutation.mutate(
        {
          payload: {
            name: data.name,
            description: data.description,
          },
        },
        {
          onSuccess: () => closeAndReset(),
        },
      );
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeAndReset();
        else onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm [&>button]:hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Role Info" : "Create New Role"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the name and description of this role."
                : "Create a new role and assign permissions later."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="mt-4">
            <Field>
              <Label htmlFor="name">
                Role Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Content Auditor"
                className="bg-slate-50"
                {...register("name")}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.name.message}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={4}
                placeholder="Briefly describe the responsibilities of this role..."
                className="w-full rounded-md border bg-slate-50 p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={closeAndReset}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isLoading || !isValid}
              className="cursor-pointer"
            >
              {isLoading
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
