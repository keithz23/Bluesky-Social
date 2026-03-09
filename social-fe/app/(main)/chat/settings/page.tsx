"use client";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function SettingsPage() {
  const router = useRouter();
  return (
    <>
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between p-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Chat Settings</h1>
        </div>
      </div>
      <div className="p-4">
        <p className="text-lg text-gray-900 font-bold mb-6">
          Allow new messages from
        </p>

        <RadioGroup
          defaultValue="everyone"
          className="w-full flex flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <Label
              htmlFor="everyone"
              className="text-base font-medium text-slate-700 cursor-pointer"
            >
              Everyone
            </Label>
            <RadioGroupItem value="everyone" id="everyone" />
          </div>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="following"
              className="text-base font-medium text-slate-700 cursor-pointer"
            >
              Users I follow
            </Label>
            <RadioGroupItem value="following" id="following" />
          </div>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="none"
              className="text-base font-medium text-slate-700 cursor-pointer"
            >
              No one
            </Label>
            <RadioGroupItem value="none" id="none" />
          </div>
        </RadioGroup>
      </div>
    </>
  );
}
