import {
  Lightbulb,
  Target,
  Rocket,
  HelpCircle,
  Briefcase,
  Database,
  Plane,
  PenLine,
  Map,
  ShoppingCart,
  Ticket,
  Compass,
} from "lucide-react";
import type { StarterChipItem } from "@/components/StarterChips";

export const GENERATE_STARTER_CHIPS: StarterChipItem[] = [
  {
    id: "gen-smb",
    label: "Find recurring problems faced by small business owners",
    value: "Find recurring problems faced by small business owners",
    icon: Briefcase,
  },
  {
    id: "gen-data",
    label: "Explore painful manual workflows for data teams",
    value: "Explore painful manual workflows for data teams",
    icon: Database,
  },
  {
    id: "gen-travel",
    label: "Find unmet needs among frequent travelers",
    value: "Find unmet needs among frequent travelers",
    icon: Plane,
  },
  {
    id: "gen-creators",
    label: "Look for frustrating tasks independent creators still do manually",
    value: "Look for frustrating tasks independent creators still do manually",
    icon: PenLine,
  },
];

export const VALIDATE_STARTER_CHIPS: StarterChipItem[] = [
  {
    id: "val-parks",
    label: "An AI trip planner for U.S. national parks",
    value: "An AI trip planner for U.S. national parks",
    icon: Map,
  },
  {
    id: "val-grocery",
    label: "A grocery-list app that organizes items by store aisle",
    value: "A grocery-list app that organizes items by store aisle",
    icon: ShoppingCart,
  },
  {
    id: "val-tickets",
    label: "A tool that turns customer-support tickets into product insights",
    value: "A tool that turns customer-support tickets into product insights",
    icon: Ticket,
  },
  {
    id: "val-solo",
    label: "A discovery platform for products built by solo founders",
    value: "A discovery platform for products built by solo founders",
    icon: Compass,
  },
];

export const CHAT_STARTER_CHIPS: StarterChipItem[] = [
  {
    id: "chat-saas",
    label: "I have an idea for a SaaS tool — help me think it through",
    value: "I have an idea for a SaaS tool — help me think it through",
    icon: Lightbulb,
  },
  {
    id: "chat-industries",
    label: "What industries have the most unmet needs right now?",
    value: "What industries have the most unmet needs right now?",
    icon: Target,
  },
  {
    id: "chat-users",
    label: "How do I find my first 100 users?",
    value: "How do I find my first 100 users?",
    icon: Rocket,
  },
  {
    id: "chat-decide",
    label: "Help me decide between two startup ideas",
    value: "Help me decide between two startup ideas",
    icon: HelpCircle,
  },
];
