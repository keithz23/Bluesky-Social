"use client";
import { useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRuleMutations } from "../../hooks/use-rules";

const ruleSchema = z.object({
  title: z.string().min(1, "Rule Title is required"),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce
    .number()
    .min(0, "Display order must be 0 or greater")
    .default(0),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

interface RuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleToEdit: any | null;
}

export default function RuleFormDialog({
  open,
  onOpenChange,
  ruleToEdit,
}: RuleFormDialogProps) {
  const isEditMode = !!ruleToEdit;
  const { createRuleMutation, updateRuleMutation } = useRuleMutations();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema) as Resolver<RuleFormValues>,
    defaultValues: {
      title: "",
      description: "",
      severity: "LOW",
      isActive: true,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (ruleToEdit) {
        reset({
          title: ruleToEdit.title || "",
          description: ruleToEdit.description || "",
          severity: ruleToEdit.severity || "LOW",
          isActive: ruleToEdit.isActive ?? true,
          displayOrder: ruleToEdit.displayOrder || 0,
        });
      } else {
        reset({
          title: "",
          description: "",
          severity: "LOW",
          isActive: true,
          displayOrder: 0,
        });
      }
    }
  }, [open, ruleToEdit, reset]);

  const onSubmit = (data: RuleFormValues) => {
    if (isEditMode) {
      updateRuleMutation.mutate(
        { ruleId: ruleToEdit.id, payload: data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createRuleMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isLoading =
    createRuleMutation?.isPending || updateRuleMutation?.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Rule" : "Create New Rule"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the details of the selected rule."
                : "Add a new rule to the community guidelines."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Rule Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g. No hate speech"
                {...register("title")}
              />
              {errors.title && (
                <span className="text-xs text-red-500">
                  {errors.title.message}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="description"
                placeholder="Explain the rule in detail..."
                rows={4}
                {...register("description")}
              />
              {errors.description && (
                <span className="text-xs text-red-500">
                  {errors.description.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Severity */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Severity</label>
                <Controller
                  control={control}
                  name="severity"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.severity && (
                  <span className="text-xs text-red-500">
                    {errors.severity.message}
                  </span>
                )}
              </div>

              {/* Display Order */}
              <div className="flex flex-col gap-2">
                <label htmlFor="displayOrder" className="text-sm font-medium">
                  Display Order
                </label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  {...register("displayOrder")}
                />
                {errors.displayOrder && (
                  <span className="text-xs text-red-500">
                    {errors.displayOrder.message}
                  </span>
                )}
              </div>
            </div>

            {/* Is Active Switch */}
            <div className="flex flex-row items-center justify-between rounded-lg border p-3 mt-2 shadow-sm">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Active Status</label>
                <p className="text-xs text-gray-500">
                  Enable or disable this rule immediately.
                </p>
              </div>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
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
