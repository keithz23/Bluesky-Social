"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, Camera, Plus } from "lucide-react";
import { useLists } from "@/app/hooks/use-list";
import { Spinner } from "@/components/ui/spinner";

interface ListFormDialogProps {
  children?: React.ReactNode;
  list?: any;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ListFormDialog({
  children,
  list,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: ListFormDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleOpenChange = (open: boolean) => {
    if (externalIsOpen !== undefined && externalOnClose) {
      if (!open) externalOnClose();
    } else {
      setInternalIsOpen(open);
    }
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [listPhoto, setListPhoto] = useState<string | undefined>(undefined);
  const [listFile, setListFile] = useState<File | undefined>(undefined);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const { createListMutation, updateListMutation, isCreating, isUpdating } =
    useLists();
  const listInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!list;
  const isSaving = isEditing ? isUpdating : isCreating;

  const hasChanges = isEditing
    ? name !== list.name ||
      description !== (list.description || "") ||
      !!listFile
    : name.trim().length > 0 || description.trim().length > 0 || !!listPhoto;

  const isSaveEnabled = name.trim().length > 0 && hasChanges && !isSaving;

  useEffect(() => {
    if (isOpen) {
      setName(list?.name || "");
      setDescription(list?.description || "");
      setListPhoto(list?.listPhoto || undefined);
      setListFile(undefined);
    }
  }, [isOpen, list]);

  const handleListPhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setListPhoto(URL.createObjectURL(file));
      setListFile(file);
    }
    event.target.value = "";
  };

  const handleSave = () => {
    if (!isSaveEnabled) return;
    const data = { name, description, listFile, listId: list.id };

    if (isEditing) {
      updateListMutation.mutate(
        { payload: data },
        {
          onSuccess: () => {
            handleOpenChange(false);
          },
        },
      );
    } else {
      createListMutation.mutate(
        { payload: data },
        {
          onSuccess: () => {
            handleOpenChange(false);
            resetForm();
          },
        },
      );
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setListPhoto(undefined);
    setListFile(undefined);
  };

  const handleCloseAttempt = () => {
    if (isSaving) return;

    if (hasChanges) {
      setShowExitConfirm(true);
    } else {
      handleOpenChange(false);
      if (!isEditing) resetForm();
    }
  };

  const handleConfirmDiscard = () => {
    if (!isEditing) resetForm();
    setShowExitConfirm(false);
    handleOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {!externalIsOpen && (
          <DialogTrigger asChild>
            {children || (
              <button
                type="button"
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[15px] px-4 py-1.5 rounded-full transition cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                New
              </button>
            )}
          </DialogTrigger>
        )}

        <DialogTitle className="sr-only">
          {isEditing ? "Edit user list" : "Create user list"}
        </DialogTitle>

        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          className="sm:max-w-125 p-0 gap-0 overflow-hidden [&>button]:hidden rounded-2xl"
        >
          {/* --- HEADER --- */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
            <button
              type="button"
              onClick={handleCloseAttempt}
              disabled={isSaving}
              className={`text-[15px] font-medium transition-colors ${
                isSaving
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-700 cursor-pointer"
              }`}
            >
              Cancel
            </button>

            <h2 className="text-[17px] font-bold text-gray-900">
              {isEditing ? "Edit user list" : "Create user list"}
            </h2>

            <button
              type="button"
              onClick={handleSave}
              disabled={!isSaveEnabled}
              className={`text-[15px] font-medium transition-colors ${
                isSaveEnabled
                  ? "text-blue-600 hover:text-blue-700 cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <div className="flex items-center gap-x-1.5 opacity-80">
                  <Spinner className="w-4 h-4" /> <span>Saving...</span>
                </div>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>

          {/* --- FORM BODY --- */}
          <div className="p-4 space-y-5 bg-white">
            {/* Avatar Section */}
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-500">
                List avatar
              </Label>
              <input
                type="file"
                hidden
                ref={listInputRef}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleListPhotoUpload}
                disabled={isSaving}
              />
              <div
                onClick={() => {
                  if (!isSaving) listInputRef.current?.click();
                }}
                className={`relative w-18 h-18 bg-[#1185fe] rounded-2xl flex items-center justify-center transition-all bg-cover bg-center shadow-sm ${
                  isSaving
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer hover:opacity-90"
                }`}
                style={{
                  backgroundImage: listPhoto ? `url(${listPhoto})` : "none",
                }}
              >
                {!listPhoto && (
                  <Users className="w-9 h-9 text-white" strokeWidth={2} />
                )}
                {/* Badge Camera */}
                <div className="absolute -bottom-1.5 -right-1.5 bg-white rounded-full p-1 shadow-sm">
                  <div className="bg-gray-900 rounded-full p-1.5">
                    <Camera
                      className="w-3.5 h-3.5 text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* List Name Section */}
            <div className="space-y-1.5">
              <Label
                htmlFor="list-name"
                className="text-[13px] font-medium text-gray-500"
              >
                List name
              </Label>
              <Input
                id="list-name"
                placeholder="e.g. Great Posters"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                className="text-[15px] py-6 bg-[#F1F5F9] border-transparent rounded-xl focus-visible:ring-0 focus-visible:bg-white focus-visible:border-[#1185fe] transition-all"
                autoFocus={!isEditing}
              />
            </div>

            {/* List Description Section */}
            <div className="space-y-1.5 pb-2">
              <Label
                htmlFor="list-desc"
                className="text-[13px] font-medium text-gray-500"
              >
                List description
              </Label>
              <Textarea
                id="list-desc"
                placeholder="e.g. The posters who never miss."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                className="text-[15px] min-h-25 resize-none bg-[#F1F5F9] border-transparent rounded-xl focus-visible:bg-white focus-visible:ring-0 focus-visible:border-[#1185fe] transition-all"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRM DISCARD MODAL --- */}
      {showExitConfirm && (
        <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <DialogTitle className="sr-only">Discard</DialogTitle>
          <DialogContent
            className="w-full max-w-[320px] rounded-[32px] bg-white p-6 shadow-xl border-none gap-0 z-1000 [&>button]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Discard changes?
              </h2>
              <p className="text-[15px] leading-snug text-gray-600 mb-6">
                Are you sure you want to discard your changes?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmDiscard}
                  className="cursor-pointer flex w-full items-center justify-center rounded-full bg-[#E42240] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#c91d37]"
                >
                  Discard
                </button>
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="cursor-pointer flex w-full items-center justify-center rounded-full bg-[#F1F5F9] py-3.5 text-[15px] font-semibold text-[#334155] transition-colors hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
