import { Badge } from "@/components/ui/badge";

export function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const daysUntilExpiry = Math.ceil(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return <Badge variant="destructive">Expired</Badge>;
  } else if (daysUntilExpiry <= 7) {
    return <Badge variant="destructive">{daysUntilExpiry} days left</Badge>;
  } else if (daysUntilExpiry <= 30) {
    return <Badge className="bg-yellow-500 hover:bg-yellow-600">{daysUntilExpiry} days left</Badge>;
  }
  return null;
}