import { Bot, Globe, Users, type LucideIcon } from "lucide-react";

export type Colour = "white" | "black" | "random";
export type ModeId = "friend" | "online" | "computer";

export type Mode = {
  id: ModeId;
  title: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
  // The mode's setup page. Only set once the mode is built.
  path?: string;
};

export const modes: Mode[] = [
  {
    id: "friend",
    title: "Play a friend",
    description: "Share an invite code.",
    icon: Users,
    enabled: true,
    path: "/play/setup/play-with-friends",
  },
  {
    id: "online",
    title: "Play online",
    description: "Get matched with someone.",
    icon: Globe,
    enabled: false,
  },
  {
    id: "computer",
    title: "Play the computer",
    description: "Practise against an engine.",
    icon: Bot,
    enabled: false,
  },
];

export const colours: { id: Colour; label: string }[] = [
  { id: "white", label: "White" },
  { id: "black", label: "Black" },
  { id: "random", label: "Random" },
];
