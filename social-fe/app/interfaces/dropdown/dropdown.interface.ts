export interface DropdownItem {
  id: number;
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
