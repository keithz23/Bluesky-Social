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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKeywordsMutation } from "../../hooks/use-keywords";
import { useRules } from "../../hooks/use-rules";

const keywordSchema = z.object({
  word: z.string().min(1, "Word is required"),
  action: z.enum(["FLAG", "WARN", "AUTO_HIDE"]),
  ruleId: z.string(),
});

type KeywordFormValues = z.infer<typeof keywordSchema>;

interface KeywordFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keywordToEdit: any | null;
}

export default function KeywordFormDialog({
  open,
  onOpenChange,
  keywordToEdit,
}: KeywordFormDialogProps) {
  const isEditMode = !!keywordToEdit;
  const { createKeywordMutation, updateKeywordMutation } =
    useKeywordsMutation();

  const { data: rulesResponse } = useRules(
    1,
    10,
    undefined,
    undefined,
    undefined,
    true,
  );

  const rulesList: Rule[] = rulesResponse?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<KeywordFormValues>({
    resolver: zodResolver(keywordSchema) as Resolver<KeywordFormValues>,
    defaultValues: {
      word: "",
      action: "FLAG",
      ruleId: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (keywordToEdit) {
        reset({
          word: keywordToEdit.word || "",
          action: keywordToEdit.action || "FLAG",
          ruleId: keywordToEdit.ruleId || "",
        });
      } else {
        reset({
          word: "",
          action: "FLAG",
          ruleId: "",
        });
      }
    }
  }, [open, keywordToEdit, reset]);

  const onSubmit = (data: KeywordFormValues) => {
    if (isEditMode) {
      updateKeywordMutation.mutate(
        { keywordId: keywordToEdit.id, payload: data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createKeywordMutation.mutate(
        { payload: data },
        {
          onSuccess: () => onOpenChange(false),
        },
      );
    }
  };

  const isLoading =
    createKeywordMutation?.isPending || updateKeywordMutation?.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Keyword" : "Create New Keyword"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the details of the selected keyword."
                : "Add a new keyword to the community guidelines."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Keyword <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g. No hate speech"
                {...register("word")}
              />
              {errors.word && (
                <span className="text-xs text-red-500">
                  {errors.word.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Rule</label>
                <Controller
                  control={control}
                  name="ruleId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Rule" />
                      </SelectTrigger>
                      <SelectContent>
                        {rulesList.map((rl) => (
                          <SelectItem value={rl.id} key={rl.id}>
                            {rl.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.action && (
                  <span className="text-xs text-red-500">
                    {errors.action.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Action</label>
                <Controller
                  control={control}
                  name="action"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FLAG">Flag</SelectItem>
                        <SelectItem value="WARN">Warn</SelectItem>
                        <SelectItem value="AUTO_HIDE">Auto Hide</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.action && (
                  <span className="text-xs text-red-500">
                    {errors.action.message}
                  </span>
                )}
              </div>
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
                  : "Create Keyword"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
