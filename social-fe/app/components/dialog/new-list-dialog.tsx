"use client";

import { useRef, useState } from "react";
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

export default function NewListDialog({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [listPhoto, setListPhoto] = useState<string | undefined>(undefined);
  const [listFile, setListFile] = useState<File | undefined>(undefined);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const listInputRef = useRef<HTMLInputElement>(null);
  const isSaveEnabled = name.trim().length > 0;

  const hasChanges =
    name.trim().length > 0 || description.trim().length > 0 || listPhoto;

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

    console.log({ name, description, listFile });

    setIsOpen(false);
  };

  const resetForm = () => {
    setName("")
    setDescription("");
    setListPhoto("");
    setListFile(undefined);
  };

  const handleCloseAttempt = () => {
    if (hasChanges) {
      setShowExitConfirm(true);
    } else {
      setIsOpen(false);
      resetForm();
    }
  };

  const handleConfirmDiscard = () => {
    resetForm();
    setShowExitConfirm(false);
    setIsOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

        <DialogTitle className="sr-only">Create user list</DialogTitle>

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
          {/* --- CUSTOM HEADER --- */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/90 backdrop-blur-md">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="text-[15px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Cancel
            </button>

            <h2 className="text-[17px] font-bold text-gray-900">
              Create user list
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
              Save
            </button>
          </div>

          {/* --- FORM BODY --- */}
          <div className="p-4 space-y-6 bg-white">
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
              />

              <div
                onClick={() => listInputRef.current?.click()}
                className="relative w-20 h-20 bg-[#1185fe] rounded-2xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity bg-cover bg-center border border-gray-100 shadow-sm"
                style={{
                  backgroundImage: listPhoto ? `url(${listPhoto})` : "none",
                }}
              >
                {!listPhoto && (
                  <Users className="w-10 h-10 text-white" strokeWidth={2} />
                )}

                {/* Badge Camera */}
                <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full p-1.5 border-2 border-white">
                  <Camera className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* List Name Section */}
            <div className="space-y-2">
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
                className="text-[15px] py-6 bg-transparent border-gray-300 rounded-xl focus-visible:ring-0 focus-visible:border focus-visible:border-[#1185fe] transition-all"
                autoFocus
              />
            </div>

            {/* List Description Section */}
            <div className="space-y-2">
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
                className="text-[15px] min-h-25 resize-none bg-gray-50/50 border-gray-200 rounded-xl focus-visible:bg-white focus-visible:ring-0 focus-visible:border focus-visible:border-[#1185fe] transition-all"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showExitConfirm && (
        <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <DialogTitle className="sr-only"></DialogTitle>
          <DialogContent
            className="w-full max-w-62.5 rounded-[32px] bg-white p-6 shadow-xl border-none gap-0 z-100 [&>button]:hidden"
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
