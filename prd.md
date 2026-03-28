# PRD — Project Requirements Document

## 1. Overview
**Warung OS** adalah aplikasi berbasis web yang dirancang khusus untuk menggantikan buku catatan manual dan kalkulator bagi pemilik UMKM di Indonesia (seperti warung makan, toko kelontong, dan usaha rumahan). 

Banyak UMKM yang saat ini mengalami "kebutaan finansial" (uang pribadi dan usaha tercampur), menebak-nebak jumlah stok barang, dan tidak memiliki catatan keuangan yang rapi untuk mengajukan pinjaman modal (seperti KUR). Warung OS hadir untuk menyelesaikan masalah tersebut dalam satu wadah yang sangat mudah digunakan, mencakup pencatatan penjualan, pembukuan dasar, manajemen stok, hingga pencatatan hutang pelanggan (kasbon).

## 2. Requirements
- **Platform Utama:** Aplikasi Web (Web App), dioptimalkan secara khusus untuk tampilan **Tablet** (kasir warung).
- **Konektivitas:** Berjalan secara *Online* (membutuhkan koneksi internet).
- **Fokus Inventaris:** Hanya melacak barang jadi (*finished goods*), tidak melacak bahan baku.
- **Model Bisnis:** Gratis dasar (*Freemium* / Basic Free) untuk menjaring pengguna baru.
- **Adopsi & Kemudahan:** Transaksi harus bisa diselesaikan di bawah 5 detik murni dengan sentuhan jari (*tap*).
- **Integrasi Eksternal:** Membutuhkan integrasi dengan WhatsApp API untuk mengirim notifikasi stok menipis dan pengingat hutang.

## 3. Core Features
Berikut adalah fitur-fitur MVP (Minimum Viable Product) yang paling penting untuk dibangun pada tahap pertama:

1. **Tap-to-Sell POS (Kasir Cepat)**
   - Layar kasir visual dengan ikon produk. Pengguna hanya perlu *tap* produk untuk memasukkan ke keranjang.
   - Pilihan metode pembayaran yang simpel: Tunai (Cash), QRIS, atau Transfer Bank.
   - Setiap penjualan secara otomatis akan memotong jumlah stok barang dan masuk ke pembukuan.

2. **Buku Hutang (Tracker Kasbon)** 
   - *Fitur andalan untuk menarik pengguna.* Pemilik dapat mencatat pelanggan yang berhutang (kasbon).
   - Menyimpan data: Nama Peminjam, Nomor WhatsApp, dan Jumlah Hutang.
   - Fitur 1-klik untuk mengirim pesan pengingat tagihan yang sopan via WhatsApp secara otomatis.

3. **Pembukuan Otomatis & Laporan PDF**
   - Laporan Laba/Rugi (Income vs Expense) yang sangat sederhana dengan bahasa sehari-hari.
   - Menampilkan metrik keuntungan Harian, Mingguan, dan Bulanan.
   - Punya tombol "Cetak PDF" untuk mengunduh laporan keuangan dasar yang bisa dipakai sebagai syarat pengajuan pinjaman KUR.

4. **Inventaris & Notifikasi Stok Menipis**
   - Menu manajemen produk (Nama barang, Harga beli, Harga jual, Sisa stok).
   - Pengurangan stok otomatis setiap ada transaksi sukses. Input restok/tambah barang dilakukan manual.
   - Peringatan via pesan WhatsApp ke nomor pemilik warung saat stok barang tertentu hampir habis.

## 4. User Flow
Berikut adalah perjalanan sederhana yang akan dialami oleh pengguna:
1. **Daftar & Pengaturan:** Pengguna mendaftar secara gratis, lalu memasukkan daftar barang dagangan beserta harga dan jumlah stok saat ini (via Tablet).
2. **Transaksi Penjualan:** Pelanggan datang membeli barang. Pemilik *tap* ikon barang di aplikasi, memilih metode bayar (misal: QRIS), dan klik "Selesai" (kurang dari 5 detik).
3. **Mencatat Kasbon:** Ada pelanggan langganan ingin berhutang. Pemilik membuka menu "Buku Hutang", memasukkan nama, nomor WA, dan nominal, lalu menyimpannya.
4. **Kirim Pengingat:** Saat jatuh tempo, pemilik membuka "Buku Hutang" dan menekan tombol kirim pesan. Pesan WA otomatis terkirim ke pelanggan bersangkutan.
5. **Cek Keuntungan:** Pemilik membuka "Laporan" untuk melihat untung bersih hari ini dan mengunduh PDF jika besok ingin ke bank mengajukan pinjaman.

## 5. Architecture
Aplikasi ini menggunakan arsitektur monolitik modern yang berjalan di atas Cloud, dengan antarmuka yang membaca data secara langsung dari database dan terhubung ke layanan pihak ketiga (WhatsApp API).

```mermaid
flowchart TD
    A[Pengguna / Pemilik Warung\nTablet Browser] -->|Akses Aplikasi web| B(Frontend Web\nUser Interface)
    B <-->|Kirim/Ambil Data Transaksi| C{Backend API\nLogika Bisnis}
    
    C <--> D[(Database\nSimpan Data UMKM)]
    
    C -->|Trigger Pesan WA| E[WhatsApp API Provider]
    E -->|Kirim Pesan| F[Pelanggan / Pemilik Warung\nAplikasi WhatsApp]
```

## 6. Sequence Diagram
Bagian ini menjelaskan aliran data teknis secara detail saat terjadi interaksi utama, yaitu Transaksi Penjualan dan Pencatatan Hutang. Diagram ini melibatkan aktor pemilik, frontend, backend, database, dan layanan WhatsApp API.

```mermaid
sequenceDiagram
    participant P as Pemilik (Tablet)
    participant FE as Frontend Web
    participant BE as Backend API
    participant DB as Database
    participant WA as WhatsApp API

    Note over P, WA: Skenario 1: Transaksi Penjualan
    P->>FE: Tap Produk & Pilih Metode Bayar
    FE->>BE: POST /api/transactions
    BE->>DB: Begin Transaction
    DB->>DB: Simpan Transaksi & Detail Item
    DB->>DB: Update Stok Produk (Reduce)
    DB->>BE: Commit Success
    BE->>DB: Cek Stok Minimum (Threshold)
    alt Stok Menipis
        BE->>WA: Trigger Notifikasi Stok
        WA->>P: Kirim WA Peringatan Stok
    end
    BE->>FE: Response Success (200 OK)
    FE->>P: Tampilkan Struk & Kembali ke Kasir

    Note over P, WA: Skenario 2: Pencatatan Hutang (Kasbon)
    P->>FE: Input Data Peminjam & Nominal
    FE->>BE: POST /api/debts
    BE->>DB: Simpan Data Hutang
    DB->>BE: Confirm Saved
    BE->>WA: Trigger WA Pengingat (Saat Jatuh Tempo/Manual)
    WA->>Pessenger: Kirim WA Tagihan ke Pelanggan
    BE->>FE: Response Success
    FE->>P: Tampilkan Status Hutang Tersimpan
```

## 7. Database Schema
Sistem membutuhkan beberapa tabel utama untuk mengatur operasional warung. Berikut adalah skema database secara high-level:

**Tabel Penjelasan:**
- **Users (Pemilik):** `id`, `nama_warung`, `no_wa_pemilik`, `email`
- **Products (Produk):** `id`, `user_id`, `nama_barang`, `harga_beli`, `harga_jual`, `stok_saat_ini`, `stok_minimum`
- **Transactions (Transaksi):** `id`, `user_id`, `total_harga`, `metode_bayar` (Tunai/QRIS), `tanggal`
- **Transaction_Items (Detail Barang):** `id`, `transaction_id`, `product_id`, `jumlah_beli`, `harga_satuan`
- **Debts (Hutang):** `id`, `user_id`, `nama_peminjam`, `no_wa_peminjam`, `jumlah_hutang`, `status_lunas` (Ya/Tidak), `tanggal`
- **Expenses (Pengeluaran):** `id`, `user_id`, `keterangan_pengeluaran`, `jumlah_uang`, `tanggal`

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : "memiliki"
    USERS ||--o{ TRANSACTIONS : "mencatat"
    USERS ||--o{ DEBTS : "mencatat"
    USERS ||--o{ EXPENSES : "mengeluarkan"
    
    TRANSACTIONS ||--|{ TRANSACTION_ITEMS : "terdiri dari"
    PRODUCTS ||--o{ TRANSACTION_ITEMS : "tercatat dalam"

    USERS {
        string id PK
        string nama_warung
        string no_wa_pemilik
    }
    PRODUCTS {
        string id PK
        string user_id FK
        string nama_barang
        int harga_beli
        int harga_jual
        int stok_saat_ini
        int stok_minimum
    }
    TRANSACTIONS {
        string id PK
        string user_id FK
        int total_harga
        string metode_bayar
        datetime tanggal
    }
    TRANSACTION_ITEMS {
        string id PK
        string transaction_id FK
        string product_id FK
        int jumlah_beli
        int harga_satuan
    }
    DEBTS {
        string id PK
        string user_id FK
        string nama_peminjam
        string no_wa_peminjam
        int jumlah_hutang
        boolean status_lunas
    }
    EXPENSES {
        string id PK
        string user_id FK
        string keterangan
        int jumlah_uang
    }
```

## 8. Tech Stack
Berdasarkan kebutuhan kecepatan pengembangan (MVP), stabilitas, dan performa web app, berikut adalah rekomendasi tumpukan teknologi (Tech Stack) yang akan digunakan:

- **Frontend / Aplikasi UI:** Web framework **Next.js** (berbasis React). Paling optimal untuk web app modern.
- **Styling & Komponen:** **Tailwind CSS** dipadukan dengan **shadcn/ui** untuk membuat tampilan dashboard kasir tablet yang rapi, cepat, dan modern.
- **Backend / API:** Menjadi satu di dalam **Next.js (App Router API)** agar proses *development* lebih cepat tanpa perlu memisahkan server.
- **Database:** **SQLite** — Sangat mumpuni, ringan, dan murah untuk level MVP yang belum membutuhkan database besar/kompleks.
- **ORM (Penghubung Database):** **Drizzle ORM** — Modern, cepat, dan sangat aman digunakan dengan TypeScript.
- **Autentikasi:** **Better Auth** — Layanan autentikasi *open-source* yang aman, mudah, dan gratis untuk login pengguna.
- **Integrasi Ke-3 (WhatsApp):** Menggunakan pihak ketiga seperti **Fonnte**, **Wablas**, atau **Twilio** untuk otomatisasi kirim pesan WA tanpa perlu mengelola server WA sendiri.
