export interface StackedBarItem {
  label: string;
  value: number;
  color: BarColor;
}

export enum BarColor {
  Red = "bg-red-500",
  Green = "bg-green-500",
  Yellow = "bg-yellow-500",
  Blue = "bg-blue-500",
  Gray = "bg-gray-500",
  Indigo = "bg-indigo-500",
  LightGray = "bg-gray-300",
  Purple = "bg-purple-500",
  Teal = "bg-teal-500",
  Pink = "bg-pink-500",
}
