import type { CSSProperties } from "react";

// Board styles built from the site's theme variables (Slate & Emerald, with
// amber as the second accent), so they follow light and dark mode.
export type BoardTheme = {
  name: string;
  description: string;
  light: string;
  dark: string;
  board?: CSSProperties;
  // Colour of the a-h / 1-8 labels. Defaults to the opposite square colour.
  notation?: string;
};

const mix = (color: string, percent: number, base: string) =>
  `color-mix(in oklab, ${color} ${percent}%, ${base})`;

const accent1 = "var(--accent-1)";
const accent2 = "var(--accent-2)";
const primary = "var(--primary)";
const card = "var(--card)";
const slate = "var(--muted-foreground)";

export const boardThemes: BoardTheme[] = [
  {
    name: "Slate",
    description: "Neutral greys from the site's base palette.",
    light: mix(slate, 12, card),
    dark: mix(slate, 55, card),
  },
  {
    name: "Emerald",
    description: "The primary accent, classic green and cream.",
    light: mix(accent1, 12, card),
    dark: mix(accent1, 75, "black"),
  },
  {
    name: "Amber",
    description: "The second accent, warm like a wooden set.",
    light: mix(accent2, 15, card),
    dark: mix(accent2, 70, "black"),
  },
  {
    name: "Slate and emerald",
    description: "Cool light squares with emerald dark squares.",
    light: mix(slate, 12, card),
    dark: mix(accent1, 70, "black"),
  },
  {
    name: "Slate and amber",
    description: "Cool light squares with amber dark squares.",
    light: mix(slate, 12, card),
    dark: mix(accent2, 75, "black"),
  },
  {
    name: "Ink",
    description: "High contrast: the primary colour against the card.",
    light: card,
    dark: primary,
    board: { border: `2px solid ${primary}` },
    notation: slate,
  },
  {
    name: "Midnight",
    description: "Low contrast and dark. Easy on the eyes.",
    light: mix(primary, 55, "black"),
    dark: mix(primary, 80, "black"),
  },
  {
    name: "Rounded",
    description: "Soft slate with rounded corners and a shadow.",
    light: mix(slate, 8, card),
    dark: mix(slate, 40, card),
    board: {
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      boxShadow: "0 10px 30px -10px rgb(0 0 0 / 0.35)",
    },
  },
  {
    name: "Framed emerald",
    description: "Emerald squares in a thick emerald frame.",
    light: mix(accent1, 20, card),
    dark: mix(accent1, 60, card),
    board: {
      border: `6px solid ${mix(accent1, 80, "black")}`,
      borderRadius: "var(--radius-md)",
    },
  },
  {
    name: "Sunset",
    description: "Amber and emerald blended, with a soft glow.",
    light: mix(accent2, 25, card),
    dark: mix(accent1, 55, mix(accent2, 50, "black")),
    board: {
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: `0 0 0 1px var(--border), 0 12px 32px -12px ${mix(accent2, 60, "transparent")}`,
    },
  },
];

// Used by boards that aren't given a theme.
export const defaultBoardTheme = boardThemes[0];
