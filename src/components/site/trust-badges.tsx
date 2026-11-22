import { BadgeCheck, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function VerifiedAgentBadge() {
  return <Badge variant="gold" className="gap-1"><BadgeCheck className="size-3.5" />Verified Agent</Badge>;
}

export function FeaturedBadge() {
  return <Badge variant="gold" className="gap-1"><Crown className="size-3.5" />Featured</Badge>;
}