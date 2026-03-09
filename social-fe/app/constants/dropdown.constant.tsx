import {
  BookA,
  Clipboard,
  EyeOff,
  Frown,
  Funnel,
  Smile,
  TriangleAlert,
  UserX,
  VolumeOff,
} from "lucide-react";
import { DropdownItem } from "../interfaces/dropdown/dropdown.interface";

export const dropdownItems: DropdownItem[] = [
  { id: 1, title: "Translate", icon: <BookA size={18} /> },
  { id: 2, title: "Copy post text", icon: <Clipboard size={18} /> },
  { id: 3, title: "Show more like this", icon: <Smile size={18} /> },
  { id: 4, title: "Show less like this", icon: <Frown size={18} /> },
  { id: 5, title: "Mute thread", icon: <VolumeOff size={18} /> },
  { id: 6, title: "Mute words & tags", icon: <Funnel size={18} /> },
  { id: 7, title: "Hide post for me", icon: <EyeOff size={18} /> },
  { id: 8, title: "Mute account", icon: <VolumeOff size={18} /> },
  { id: 9, title: "Block account", icon: <UserX size={18} /> },
  { id: 10, title: "Report post", icon: <TriangleAlert size={18} /> },
];
