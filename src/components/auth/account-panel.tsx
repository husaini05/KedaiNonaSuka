"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/format";

export function AccountPanel() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Kamu sudah keluar dari akun.");
      router.refresh();
      router.push("/auth");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal keluar dari akun.");
    }
  }

  if (isPending) {
    return (
      <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="h-3 w-24 rounded bg-white/10" />
      </div>
    );
  }

  if (!session) return null;

  const initials = getInitials(session.user.name || session.user.email || "KN");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-[0_4px_12px_-4px_rgba(232,130,26,0.45)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-sidebar-foreground leading-tight">
            {session.user.name || "Pemilik Warung"}
          </p>
          <p className="truncate text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {session.user.email}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-xl text-sidebar-foreground/50 hover:bg-white/10 hover:text-sidebar-foreground"
          onClick={() => void handleSignOut()}
          aria-label="Keluar"
        >
          <LogOut className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
