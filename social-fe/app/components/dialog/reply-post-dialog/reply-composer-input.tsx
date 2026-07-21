type ReplyComposerInputProps = {
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
};

export function ReplyComposerInput({
  value,
  maxLength,
  onChange,
}: ReplyComposerInputProps) {
  return (
    <div className="px-4 flex gap-3">
      <div className="w-12 h-12 rounded-full bg-[#F05555] shrink-0 flex items-center justify-center text-white font-medium text-2xl">
        @
      </div>
      <div className="flex-1 pt-2">
        <textarea
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-none border-none outline-none focus:ring-0 text-[17px] placeholder:text-gray-400 min-h-20"
          placeholder="Write your reply"
        />
      </div>
    </div>
  );
}
