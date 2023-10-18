export enum Color {
  GRAY,
  YELLOW,
  GREEN,
}

export function backgroundClassForColor(color: Color | undefined): string {
  switch (color) {
    case Color.GRAY:
      return "bg-gray-500";
    case Color.YELLOW:
      return "bg-yellow-500";
    case Color.GREEN:
      return "bg-green-600";
    case undefined:
      return "bg-gray-300";
  }
}
