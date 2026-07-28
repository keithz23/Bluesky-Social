"use client";
import { useEffect, useState } from "react";
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
  const isEditing = !!ruleToEdit;

  const { createRuleMutation, updateRuleMutation } = useRuleMutations();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "LOW",
    isActive: true,
    displayOrder: 0,
  });

  useEffect(() => {
    if (open && ruleToEdit) {
      setFormData({
        title: ruleToEdit.title || "",
        description: ruleToEdit.description || "",
        severity: ruleToEdit.severity || "LOW",
        isActive: ruleToEdit.isActive ?? true,
        displayOrder: ruleToEdit.displayOrder || 0,
      });
    } else if (open && !ruleToEdit) {
      // Reset form khi tạo mới
      setFormData({
        title: "",
        description: "",
        severity: "LOW",
        isActive: true,
        displayOrder: 0,
      });
    }
  }, [open, ruleToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "displayOrder" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateRuleMutation.mutate(
        { id: ruleToEdit.id, data: formData },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createRuleMutation.mutate(formData, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isLoading =
    createRuleMutation?.isPending || updateRuleMutation?.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Rule" : "Create New Rule"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
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
                name="title"
                placeholder="e.g. No hate speech"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Explain the rule in detail..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Severity */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Severity</label>
                <Select
                  value={formData.severity}
                  onValueChange={(val) => handleSelectChange(val, "severity")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Display Order */}
              <div className="flex flex-col gap-2">
                <label htmlFor="displayOrder" className="text-sm font-medium">
                  Display Order
                </label>
                <Input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={handleChange}
                />
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
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
