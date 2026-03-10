import { Radio } from "lucide-react";
import { List } from "../interfaces/list.interface";

interface ListItemProps {
  item: List;
}

export default function ListItem({ item }: ListItemProps) {
  return (
    <div className="flex flex-col gap-2.5 p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {item.listPhoto ? (
          <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center overflow-hidden">
            <Radio className="w-7 h-7 text-white" strokeWidth={2.5} />
            <img src={item.listPhoto} alt="list photo" />
          </div>
        ) : (
          <div className="w-12 h-12 shrink-0 bg-[#1185fe] rounded-xl flex items-center justify-center overflow-hidden">
            <Radio className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
        )}

        <div className="flex flex-col justify-center">
          <p className="text-[17px] font-bold text-gray-900 leading-tight">
            {item.name}
          </p>
          <p className="text-[15px] text-gray-500 leading-tight mt-0.5">
            List by @{item.user.username}
          </p>
        </div>
      </div>

      <div className="text-[15px] text-gray-900 wrap-break-words whitespace-pre-wrap">
        {item.description}
      </div>
    </div>
  );
}
