import Link from "next/link";
import { ChevLeftIcon } from "@/components/ui/Icons";

export function Breadcrumb() {
  return (
    <div className="breadcrumb">
      <Link href="/events">
        <ChevLeftIcon /> Back to Events
      </Link>
    </div>
  );
}
