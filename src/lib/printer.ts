"use client";

// ── ESC/POS constants ─────────────────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

// ── Known BLE thermal printer service/characteristic UUIDs ───────────────────
// Covers: most generic Chinese 58mm/80mm BLE printers, Nordic UART devices
const KNOWN_SERVICES = [
  // Generic BLE serial (POS-58, POS-80, many no-brand printers)
  { service: "000018f0-0000-1000-8000-00805f9b34fb", characteristic: "00002af1-0000-1000-8000-00805f9b34fb" },
  // Another common Chinese BLE printer variant
  { service: "e7810a71-73ae-499d-8c15-faa9aef0c3f2", characteristic: "be15beef-6186-407e-8381-0bd89c4d8df4" },
  // Nordic UART Service (used by many BLE-to-serial modules)
  { service: "6e400001-b5a3-f393-e0a9-e50e24dcca9e", characteristic: "6e400002-b5a3-f393-e0a9-e50e24dcca9e" },
];

const CHUNK_SIZE = 100; // BLE MTU safe chunk size (bytes)
const CHUNK_DELAY_MS = 20; // Delay between chunks to avoid buffer overflow

// ── Types ─────────────────────────────────────────────────────────────────────
export type PrinterStatus = "disconnected" | "connecting" | "connected" | "error";

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  transactionId: string;
  date: string;
  time: string;
  items: Array<{ name: string; qty: number; unitPrice: number }>;
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  change?: number;
  footer?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function merge(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

/** Convert string to bytes, replacing non-ASCII to avoid printer garble */
function toBytes(text: string): Uint8Array {
  // Replace common Indonesian diacritics with ASCII equivalents
  const ascii = text
    .replace(/[àáâãäå]/gi, "a")
    .replace(/[èéêë]/gi, "e")
    .replace(/[ìíîï]/gi, "i")
    .replace(/[òóôõö]/gi, "o")
    .replace(/[ùúûü]/gi, "u")
    .replace(/[ñ]/gi, "n")
    .replace(/[^\x00-\x7F]/g, "?"); // remaining non-ASCII → ?
  return new TextEncoder().encode(ascii);
}

/** Format as "Rp12.500" for compact receipt printing */
function rp(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}

const LF_BYTE = new Uint8Array([LF]);
const INIT    = new Uint8Array([ESC, 0x40]);            // Initialize
const CENTER  = new Uint8Array([ESC, 0x61, 0x01]);      // Center align
const LEFT    = new Uint8Array([ESC, 0x61, 0x00]);      // Left align
const BOLD_ON  = new Uint8Array([ESC, 0x45, 0x01]);
const BOLD_OFF = new Uint8Array([ESC, 0x45, 0x00]);
const DBL_H_ON  = new Uint8Array([GS, 0x21, 0x01]);     // Double height
const DBL_H_OFF = new Uint8Array([GS, 0x21, 0x00]);
// GS V B n — feed n dot-lines then full cut; n=1 minimises whitespace on P58C
const CUT     = new Uint8Array([GS, 0x56, 0x42, 0x01]);

// ── ESC/POS Receipt Builder ───────────────────────────────────────────────────
export function buildEscPosReceipt(data: ReceiptData): Uint8Array {
  const WIDTH = 32; // 58mm printer = 32 chars per line
  const DIV = "-".repeat(WIDTH);

  function line(text: string): Uint8Array {
    return merge(toBytes(text.substring(0, WIDTH)), LF_BYTE);
  }
  function divider(): Uint8Array { return line(DIV); }
  function blankLine(): Uint8Array { return LF_BYTE; }
  function cols(left: string, right: string): Uint8Array {
    const r = right.substring(0, 12);
    const l = left.substring(0, WIDTH - r.length - 1);
    const spaces = " ".repeat(WIDTH - l.length - r.length);
    return line(l + spaces + r);
  }

  const parts: Uint8Array[] = [
    INIT,
    CENTER, BOLD_ON, DBL_H_ON,
    line(data.storeName),
    DBL_H_OFF, BOLD_OFF,
  ];

  if (data.storeAddress) parts.push(line(data.storeAddress));

  parts.push(
    divider(),
    LEFT,
    line("No: " + data.transactionId),
    line(data.date + " " + data.time),
    divider(),
  );

  // Items
  for (const item of data.items) {
    const subtotal = rp(item.unitPrice * item.qty);
    parts.push(line(item.name));
    parts.push(cols(`  x${item.qty}  ${rp(item.unitPrice)}`, subtotal));
  }

  parts.push(
    divider(),
    BOLD_ON,
    cols("TOTAL", rp(data.total)),
    BOLD_OFF,
    line("Bayar: " + data.paymentMethod),
  );

  if (data.cashReceived && data.change !== undefined) {
    parts.push(
      cols("Diterima", rp(data.cashReceived)),
      cols("Kembalian", rp(data.change)),
    );
  }

  parts.push(
    divider(),
    CENTER,
    line(data.footer ?? "Terima kasih!"),
    blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(),
    CUT,
  );

  return merge(...parts);
}

// ── Web Bluetooth type shims (not in default TS lib) ─────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
type BLEDevice        = any;
type BLECharacteristic = any;
type BLENavigator     = Navigator & { bluetooth: any };
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Bluetooth Printer Class ───────────────────────────────────────────────────
export class BluetoothPrinter {
  private device: BLEDevice = null;
  private characteristic: BLECharacteristic = null;
  private _status: PrinterStatus = "disconnected";
  private _deviceName: string | null = null;
  // Public so the singleton helper can swap it without a cast
  public onStatusChange?: (s: PrinterStatus, name: string | null) => void;

  constructor(onStatusChange?: (s: PrinterStatus, name: string | null) => void) {
    this.onStatusChange = onStatusChange;
  }

  private setStatus(s: PrinterStatus) {
    this._status = s;
    this.onStatusChange?.(s, this._deviceName);
  }

  get status(): PrinterStatus     { return this._status; }
  get deviceName(): string | null { return this._deviceName; }
  get isConnected(): boolean      { return this._status === "connected"; }

  /** Request user to pick a Bluetooth printer and connect */
  async connect(): Promise<void> {
    if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
      throw new Error("Web Bluetooth tidak didukung. Gunakan Chrome / Edge di Android atau desktop.");
    }

    this.setStatus("connecting");

    try {
      const bt = (navigator as BLENavigator).bluetooth;
      const optionalServices = KNOWN_SERVICES.map((s) => s.service);

      this.device = await bt.requestDevice({ acceptAllDevices: true, optionalServices });
      this._deviceName = this.device.name ?? "Printer Tidak Dikenal";

      this.device.addEventListener("gattserverdisconnected", () => {
        this.characteristic = null;
        this.setStatus("disconnected");
      });

      const server = await this.device.gatt.connect();

      // Try each known service/characteristic pair until one responds
      for (const { service, characteristic } of KNOWN_SERVICES) {
        try {
          const svc  = await server.getPrimaryService(service);
          const char = await svc.getCharacteristic(characteristic);
          this.characteristic = char;
          this.setStatus("connected");
          return;
        } catch {
          // Try next
        }
      }

      throw new Error(
        "Printer tidak dikenali. Pastikan printer ESC/POS BLE sudah aktif dan dalam jangkauan."
      );
    } catch (error) {
      this._deviceName = null;
      this.setStatus("error");
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.device?.gatt?.disconnect();
    this.device = null;
    this.characteristic = null;
    this._deviceName = null;
    this.setStatus("disconnected");
  }

  /** Send raw bytes to printer in BLE-safe chunks */
  async print(data: Uint8Array): Promise<void> {
    if (!this.characteristic) throw new Error("Printer belum terhubung.");

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await this.characteristic.writeValue(chunk);
      await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS));
    }
  }
}

// ── Module-level singleton (persists across renders) ─────────────────────────
let _printer: BluetoothPrinter | null = null;

export function getPrinter(
  onStatusChange?: (s: PrinterStatus, name: string | null) => void
): BluetoothPrinter {
  if (!_printer) {
    _printer = new BluetoothPrinter(onStatusChange);
  } else if (onStatusChange) {
    _printer.onStatusChange = onStatusChange;
  }
  return _printer;
}
