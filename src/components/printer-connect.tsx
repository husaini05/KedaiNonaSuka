"use client";

import { useCallback, useEffect, useState } from "react";
import { Bluetooth, BluetoothConnected, BluetoothOff, BluetoothSearching, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { buildEscPosReceipt, getPrinter, PrinterStatus, ReceiptData } from "@/lib/printer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Status indicator pill ─────────────────────────────────────────────────────
export function PrinterStatusPill({ className }: { className?: string }) {
  const [status, setStatus] = useState<PrinterStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);

  useEffect(() => {
    const printer = getPrinter((s, name) => {
      setStatus(s);
      setDeviceName(name);
    });
    setStatus(printer.status);
    setDeviceName(printer.deviceName);
  }, []);

  if (status === "disconnected") return null;

  const map: Record<PrinterStatus, { icon: React.ReactNode; label: string; cls: string }> = {
    disconnected: { icon: <BluetoothOff className="size-3" />, label: "Tidak terhubung", cls: "bg-muted text-muted-foreground" },
    connecting:   { icon: <BluetoothSearching className="size-3 animate-pulse" />, label: "Menghubungkan...", cls: "bg-blue-100 text-blue-700" },
    connected:    { icon: <BluetoothConnected className="size-3" />, label: deviceName ?? "Terhubung", cls: "bg-green-100 text-green-700" },
    error:        { icon: <BluetoothOff className="size-3" />, label: "Gagal konek", cls: "bg-destructive/10 text-destructive" },
  };

  const { icon, label, cls } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", cls, className)}>
      {icon}
      {label}
    </span>
  );
}

// ── Connect / disconnect button ───────────────────────────────────────────────
export function PrinterConnectButton({ className }: { className?: string }) {
  const [status, setStatus] = useState<PrinterStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);

  useEffect(() => {
    const printer = getPrinter((s, name) => {
      setStatus(s);
      setDeviceName(name);
    });
    setStatus(printer.status);
    setDeviceName(printer.deviceName);
  }, []);

  const handleConnect = useCallback(async () => {
    const printer = getPrinter();
    try {
      await printer.connect();
      toast.success("Printer terhubung!", { description: printer.deviceName ?? undefined });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menghubungkan printer.";
      if (!msg.includes("cancelled") && !msg.includes("chosen")) {
        toast.error(msg);
      }
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    const printer = getPrinter();
    await printer.disconnect();
    toast.info("Printer diputus.");
  }, []);

  if (status === "connected") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
          <BluetoothConnected className="size-3.5" />
          {deviceName ?? "Printer"}
        </span>
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          aria-label="Putuskan printer"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("rounded-full gap-1.5", className)}
      onClick={() => void handleConnect()}
      disabled={status === "connecting"}
    >
      {status === "connecting" ? (
        <BluetoothSearching className="size-4 animate-pulse text-blue-500" />
      ) : (
        <Bluetooth className="size-4" />
      )}
      {status === "connecting" ? "Menghubungkan..." : "Konek Printer"}
    </Button>
  );
}

// ── Print receipt button ──────────────────────────────────────────────────────
interface PrintReceiptButtonProps {
  receipt: ReceiptData;
  className?: string;
  children?: React.ReactNode;
}

export function PrintReceiptButton({ receipt, className, children }: PrintReceiptButtonProps) {
  const [status, setStatus] = useState<PrinterStatus>("disconnected");
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const printer = getPrinter((s) => setStatus(s));
    setStatus(printer.status);
  }, []);

  const handlePrint = useCallback(async () => {
    const printer = getPrinter();

    // Auto-connect if not yet connected
    if (!printer.isConnected) {
      try {
        await printer.connect();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Gagal menghubungkan printer.";
        if (!msg.includes("cancelled") && !msg.includes("chosen")) {
          toast.error(msg);
        }
        return;
      }
    }

    setIsPrinting(true);
    try {
      const bytes = buildEscPosReceipt(receipt);
      await printer.print(bytes);
      toast.success("Struk berhasil dicetak!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mencetak struk.");
    } finally {
      setIsPrinting(false);
    }
  }, [receipt]);

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("rounded-full gap-1.5", className)}
      onClick={() => void handlePrint()}
      disabled={isPrinting}
    >
      {isPrinting ? (
        <span className="size-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
      ) : (
        <Printer className="size-4" />
      )}
      {children ?? (status === "connected" ? "Cetak Struk" : "Konek & Cetak")}
    </Button>
  );
}

// ── Full printer settings card (used in /pengaturan) ─────────────────────────
export function PrinterSettingsCard() {
  const [status, setStatus] = useState<PrinterStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);

  useEffect(() => {
    const printer = getPrinter((s, name) => { setStatus(s); setDeviceName(name); });
    setStatus(printer.status);
    setDeviceName(printer.deviceName);
  }, []);

  const handleConnect = useCallback(async () => {
    const printer = getPrinter();
    try {
      await printer.connect();
      toast.success("Printer terhubung!", { description: printer.deviceName ?? undefined });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menghubungkan printer.";
      if (!msg.includes("cancelled") && !msg.includes("chosen")) toast.error(msg);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    await getPrinter().disconnect();
    toast.info("Printer diputus.");
  }, []);

  const statusInfo = {
    disconnected: { color: "text-muted-foreground", bg: "bg-muted/50", icon: <BluetoothOff className="size-5 text-muted-foreground" />, label: "Belum terhubung" },
    connecting:   { color: "text-blue-600", bg: "bg-blue-50", icon: <BluetoothSearching className="size-5 text-blue-500 animate-pulse" />, label: "Menghubungkan..." },
    connected:    { color: "text-green-700", bg: "bg-green-50", icon: <BluetoothConnected className="size-5 text-green-600" />, label: deviceName ?? "Terhubung" },
    error:        { color: "text-destructive", bg: "bg-destructive/5", icon: <BluetoothOff className="size-5 text-destructive" />, label: "Gagal terhubung" },
  }[status];

  const btSupported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className={cn("flex items-center gap-3 rounded-2xl p-4", statusInfo.bg)}>
        {statusInfo.icon}
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold", statusInfo.color)}>{statusInfo.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {status === "connected"
              ? "Printer siap mencetak struk ESC/POS."
              : status === "connecting"
              ? "Menunggu konfirmasi dari perangkat..."
              : btSupported
              ? "Klik 'Konek Printer' lalu pilih printer dari daftar Bluetooth."
              : "Web Bluetooth tidak didukung — gunakan Chrome atau Edge di Android."}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {status !== "connected" ? (
          <Button
            type="button"
            className="rounded-full"
            onClick={() => void handleConnect()}
            disabled={status === "connecting" || !btSupported}
          >
            {status === "connecting" ? (
              <BluetoothSearching className="size-4 animate-pulse" />
            ) : (
              <Bluetooth className="size-4" />
            )}
            {status === "connecting" ? "Mencari printer..." : "Konek Printer Bluetooth"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/5"
            onClick={() => void handleDisconnect()}
          >
            <X className="size-4" />
            Putuskan Printer
          </Button>
        )}
      </div>

      {/* Help text */}
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground">Printer yang didukung</p>
        <p>Printer thermal Bluetooth ESC/POS 58mm atau 80mm (merek: POS-58, GOOJPRT, Xprinter, Epson TM-P20, dsb).</p>
        <p>Pastikan printer <strong>sudah menyala</strong> dan <strong>Bluetooth HP aktif</strong> sebelum menekan konek.</p>
        <p>Tidak perlu pasangkan printer terlebih dahulu di pengaturan sistem — cukup klik konek di sini.</p>
      </div>
    </div>
  );
}
