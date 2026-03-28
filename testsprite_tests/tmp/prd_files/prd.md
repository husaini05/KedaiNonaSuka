# Product Specification - Warung OS

## 1. Ringkasan Produk
Warung OS adalah aplikasi web operasional untuk pemilik warung dan UMKM kecil di Indonesia. Produk ini menyatukan kasir cepat, inventaris barang jadi, buku hutang pelanggan, laporan usaha sederhana, dan pengaturan profil warung dalam satu workspace per pengguna.

Dokumen ini disusun berdasarkan implementasi aplikasi yang ada di repository saat ini, bukan versi konseptual. Tujuannya adalah memberi spesifikasi produk yang akurat terhadap perilaku aplikasi sekarang, sekaligus menandai area yang masih berupa placeholder atau belum lengkap.

## 2. Masalah yang Diselesaikan
Pemilik warung kecil sering menjalankan operasi harian dengan kombinasi buku tulis, kalkulator, ingatan pribadi, dan chat WhatsApp. Dampaknya:

- transaksi cepat, tetapi tidak tercatat rapi
- stok barang baru dicek saat hampir habis
- kasbon pelanggan sulit ditagih dan sulit dipantau
- laporan usaha tidak konsisten untuk evaluasi atau pengajuan modal
- data usaha bercampur dengan aktivitas pribadi

Warung OS dirancang untuk mengurangi beban admin harian itu dengan alur yang sederhana, visual, dan cocok dipakai dari tablet atau layar sentuh.

## 3. Target Pengguna
### Pengguna utama
- Pemilik warung kelontong
- Pemilik warung makan kecil
- Pelaku usaha rumahan dengan stok barang jadi

### Karakteristik pengguna
- Tidak selalu terbiasa dengan software bisnis yang kompleks
- Butuh input cepat saat jam ramai
- Lebih nyaman dengan istilah operasional sehari-hari daripada istilah akuntansi formal
- Sering memakai WhatsApp sebagai jalur komunikasi utama dengan pelanggan

## 4. Nilai Utama Produk
- Kasir cepat dengan alur tap-to-sell yang mudah dipahami
- Stok barang langsung berkurang ketika transaksi tersimpan
- Kasbon pelanggan tercatat dan mudah ditindaklanjuti
- Ringkasan usaha bisa dibaca tanpa perlu memahami laporan akuntansi penuh
- Setiap pengguna memiliki workspace warung sendiri setelah login

## 5. Sasaran Produk
### Sasaran rilis saat ini
- Menyediakan fondasi produk operasional warung berbasis akun
- Menghubungkan UI ke backend dan database Postgres
- Menyimpan transaksi, produk, hutang, dan pengaturan per pengguna
- Menyediakan dashboard dan laporan dasar yang bisa dipakai untuk monitoring harian

### Bukan fokus rilis saat ini
- POS offline-first
- printer receipt atau integrasi hardware kasir
- integrasi pembayaran langsung dengan QRIS atau bank
- integrasi WhatsApp provider sungguhan
- multi-branch atau multi-store management
- pembelian ke supplier, bahan baku, dan manajemen gudang kompleks
- laporan akuntansi formal lengkap

## 6. Platform dan Posisi Produk
- Platform utama: web app
- Optimasi pengalaman: dashboard dan kasir tablet-first, tetap dapat dibuka di desktop
- Model akses: pengguna login dengan email dan password
- Arsitektur aplikasi: monolith Next.js dengan App Router, route handlers, Better Auth, Drizzle ORM, dan PostgreSQL

## 7. Cakupan Fitur Saat Ini
### 7.1 Autentikasi dan workspace pengguna
Pengguna dapat:

- mendaftar akun baru dengan nama, email, dan password
- masuk dengan email dan password
- logout dari aplikasi

Perilaku sistem:

- sesi dikelola oleh Better Auth
- setelah login, aplikasi melakukan bootstrap state dari backend
- bila profil warung pengguna belum ada, sistem otomatis membuat workspace awal beserta profil default

### 7.2 Dashboard operasional
Dashboard menampilkan:

- omzet hari ini
- jumlah transaksi hari ini
- jumlah item stok menipis
- total kasbon aktif
- transaksi terakhir beserta itemnya
- timeline transaksi terbaru
- daftar produk yang perlu perhatian
- daftar kasbon terbaru

Tujuan utama dashboard adalah memberi ringkasan cepat tanpa mengganggu layar kasir.

### 7.3 Kasir cepat
Halaman kasir memungkinkan pengguna:

- melihat katalog produk aktif
- mencari produk berdasarkan nama atau deskripsi
- memfilter produk berdasarkan kategori
- menambahkan produk ke keranjang dengan satu tap
- mengubah quantity item dalam keranjang
- menghapus item dari keranjang
- memilih metode pembayaran aktif
- menyelesaikan checkout

Perilaku sistem saat checkout:

- validasi bahwa keranjang tidak kosong
- validasi bahwa setiap produk masih punya stok cukup
- membuat transaksi baru
- membuat detail item transaksi
- mengurangi stok setiap produk yang terjual
- mengembalikan data transaksi dan stok terbaru ke frontend

Metode pembayaran yang saat ini didukung:

- Tunai
- QRIS
- Transfer

Kategori produk yang saat ini dipakai:

- Makanan
- Minuman
- Sembako
- Kebutuhan Harian

### 7.4 Inventaris barang jadi
Halaman inventaris memungkinkan pengguna:

- melihat seluruh produk
- mencari produk berdasarkan nama, kategori, atau catatan
- menambah produk baru
- mengubah data produk
- menambah stok melalui aksi restock
- melihat produk yang masuk area stok menipis
- melihat estimasi nilai modal stok

Data produk yang disimpan:

- nama produk
- kategori
- harga beli
- harga jual
- stok saat ini
- stok minimum
- deskripsi singkat

Fokus inventaris saat ini adalah barang jadi. Belum ada konsep bahan baku, supplier, batch, expiry, atau purchase order.

### 7.5 Buku hutang pelanggan
Halaman buku hutang memungkinkan pengguna:

- menambah catatan kasbon baru
- mencari hutang berdasarkan nama atau nomor WhatsApp
- memfilter status semua, belum lunas, atau lunas
- menandai hutang sebagai lunas
- mengirim pengingat hutang

Data hutang yang disimpan:

- nama peminjam
- nomor WhatsApp
- nominal hutang
- tanggal pencatatan
- tanggal jatuh tempo
- status lunas
- waktu terakhir pengingat dikirim

Catatan implementasi penting:

- tombol pengingat saat ini belum terhubung ke provider WhatsApp
- aksi pengingat hanya memperbarui `lastReminderAt` di backend dan menampilkan feedback di UI

### 7.6 Laporan usaha
Halaman laporan menampilkan ringkasan untuk periode:

- harian
- mingguan
- bulanan

Metrik yang dihitung:

- omzet
- harga pokok barang terjual
- pengeluaran
- laba kotor
- laba bersih
- rata-rata nilai transaksi
- jumlah transaksi
- tren omzet
- produk dengan pergerakan penjualan tertinggi

Sumber data:

- transaksi tersimpan
- item transaksi
- pengeluaran tersimpan di database

Catatan implementasi penting:

- saat ini belum ada UI untuk menambah atau mengubah pengeluaran
- data pengeluaran sudah ada di model data dan dipakai oleh logika laporan
- preview PDF sudah tersedia sebagai layout visual
- tombol print dan export PDF masih placeholder

### 7.7 Pengaturan warung
Halaman pengaturan memungkinkan pengguna:

- mengubah nama warung
- mengubah tagline
- mengubah kota dan alamat
- mengubah nama pemilik dan nomor WhatsApp
- menulis catatan bisnis
- mengatur ambang notifikasi stok menipis
- memilih metode pembayaran yang aktif di kasir
- me-reset workspace ke kondisi awal

Perilaku reset workspace:

- menghapus transaksi, detail transaksi, hutang, pengeluaran, produk, dan profil warung milik user
- membuat ulang workspace default untuk user yang sama

## 8. Alur Pengguna Utama
### 8.1 Daftar dan mulai memakai aplikasi
1. Pengguna membuka halaman autentikasi.
2. Pengguna mendaftar akun baru atau login.
3. Setelah berhasil, pengguna diarahkan ke dashboard.
4. Backend memastikan user memiliki workspace warung.
5. Aplikasi memuat seluruh state awal dari API bootstrap.

### 8.2 Menjual barang dari kasir
1. Pengguna membuka halaman kasir.
2. Pengguna mencari atau memilih produk dari katalog.
3. Produk ditambahkan ke keranjang.
4. Pengguna mengatur quantity bila perlu.
5. Pengguna memilih metode pembayaran.
6. Pengguna menekan checkout.
7. Sistem menyimpan transaksi dan mengurangi stok.
8. UI menampilkan notifikasi sukses dan memperbarui data stok.

### 8.3 Menambah atau restock produk
1. Pengguna membuka halaman inventaris.
2. Pengguna menambah produk baru atau membuka mode edit.
3. Pengguna menyimpan perubahan.
4. Bila stok ingin ditambah, pengguna menjalankan aksi restock.
5. Sistem memperbarui stok dan menampilkan data terbaru.

### 8.4 Mencatat dan menagih kasbon
1. Pengguna membuka halaman buku hutang.
2. Pengguna menambah catatan hutang baru.
3. Saat ingin follow-up, pengguna menekan tombol kirim pengingat.
4. Sistem menandai waktu pengingat terakhir.
5. Saat pembayaran diterima, pengguna menandai hutang sebagai lunas.

### 8.5 Mengecek performa usaha
1. Pengguna membuka halaman laporan.
2. Pengguna memilih periode harian, mingguan, atau bulanan.
3. Sistem menghitung metrik usaha dari data transaksi dan pengeluaran.
4. Pengguna membaca preview layout PDF.
5. Pengguna belum bisa mengekspor PDF final karena fitur masih placeholder.

## 9. Kebutuhan Fungsional
### 9.1 Akun dan akses
- Sistem harus mendukung sign up dan sign in berbasis email + password.
- Sistem harus memisahkan data berdasarkan `userId`.
- Sistem harus menolak akses API ketika sesi tidak valid.

### 9.2 Manajemen produk
- Sistem harus bisa membuat produk baru.
- Sistem harus bisa memperbarui produk existing.
- Sistem harus bisa menambah stok produk.
- Sistem harus menyimpan harga beli dan harga jual untuk perhitungan laporan.

### 9.3 Transaksi
- Sistem harus menolak checkout jika keranjang kosong.
- Sistem harus menolak checkout jika stok tidak cukup.
- Sistem harus menyimpan transaksi dan item transaksi secara konsisten.
- Sistem harus mengurangi stok produk setelah transaksi sukses.

### 9.4 Buku hutang
- Sistem harus bisa menyimpan hutang baru.
- Sistem harus bisa menandai hutang sebagai lunas.
- Sistem harus bisa menandai waktu pengingat terakhir.

### 9.5 Laporan
- Sistem harus menghitung omzet, HPP, pengeluaran, laba kotor, laba bersih, dan rata-rata tiket.
- Sistem harus mendukung agregasi data untuk range harian, mingguan, dan bulanan.

### 9.6 Pengaturan
- Sistem harus menyimpan profil warung per user.
- Sistem harus menyimpan daftar metode pembayaran aktif.
- Sistem harus menyimpan ambang alert stok menipis.
- Sistem harus bisa melakukan reset workspace user.

## 10. Kebutuhan Non-Fungsional
- UI harus mudah dipakai pada layar sentuh dan ukuran tablet.
- Respons operasional harus terasa cepat untuk alur kasir.
- API route harus berjalan di runtime Node.js karena bergantung pada akses database dan auth server-side.
- Data penting harus tersimpan di PostgreSQL, bukan hanya di state frontend.
- Aplikasi harus tetap bisa dijalankan secara lokal dengan konfigurasi Postgres sederhana.

## 11. Model Data Produk
### Entitas utama
- `store_profiles`
- `products`
- `transactions`
- `transaction_items`
- `debts`
- `expenses`

### Relasi utama
- satu user memiliki satu profil warung
- satu user memiliki banyak produk
- satu user memiliki banyak transaksi
- satu transaksi memiliki banyak item transaksi
- satu user memiliki banyak hutang
- satu user memiliki banyak pengeluaran

### Catatan penting model data
- `enabledPayments` disimpan sebagai `jsonb`
- status lunas hutang disimpan sebagai integer `0/1`
- semua timestamp utama disimpan sebagai `timestamptz`

## 12. API Produk Saat Ini
API internal yang sudah tersedia:

- `GET /api/bootstrap`
- `POST /api/bootstrap/reset`
- `POST /api/transactions`
- `POST /api/products`
- `PATCH /api/products/:id`
- `POST /api/products/:id/restock`
- `POST /api/debts`
- `PATCH /api/debts/:id`
- `POST /api/debts/:id/remind`
- `PUT /api/settings`
- `ALL /api/auth/[...all]` untuk Better Auth

API ini dipakai langsung oleh frontend melalui provider state aplikasi.

## 13. Batasan Produk Saat Ini
- belum ada integrasi WhatsApp provider asli
- belum ada CRUD pengeluaran dari UI
- belum ada export PDF sungguhan
- belum ada delete produk atau delete hutang
- belum ada diskon, pajak, voucher, atau split payment
- belum ada role admin/kasir atau multi-user per warung
- belum ada mode offline
- belum ada stok opname, supplier, atau pembelian stok

## 14. Risiko Produk
- tanpa mode offline, warung bergantung pada koneksi saat bertransaksi
- tanpa pengeluaran dari UI, akurasi laporan laba bersih masih bergantung pada seed atau input backend
- tanpa WhatsApp sungguhan, value proposition pengingat hutang dan stok belum sepenuhnya tercapai
- tanpa delete flow, koreksi data masih terbatas pada update dan reset workspace

## 15. Prioritas Pengembangan Berikutnya
Prioritas yang paling logis setelah rilis saat ini:

1. Tambah CRUD pengeluaran dari UI agar laporan laba bersih benar-benar operasional.
2. Implementasikan export PDF atau print-ready flow sungguhan.
3. Integrasikan provider WhatsApp untuk pengingat hutang dan notifikasi stok.
4. Tambahkan seed/onboarding produk awal agar user baru tidak mulai dari layar kosong.
5. Tambahkan delete/archive untuk produk dan hutang.
6. Tambahkan metrik laporan yang lebih lengkap, termasuk performa per metode pembayaran dan produk.

## 16. Definisi Sukses
Versi produk saat ini dapat dianggap berhasil bila:

- pengguna bisa membuat akun dan masuk tanpa hambatan
- pengguna bisa menambah produk, menjual produk, dan melihat stok berkurang
- pengguna bisa mencatat kasbon dan menandai pelunasan
- pengguna bisa menyimpan profil warung dan melihat perubahan tercermin di UI
- pengguna bisa membaca laporan dasar dari data transaksi yang sudah tersimpan

## 17. Ringkasan Status
Warung OS sudah berada pada tahap MVP fungsional untuk alur inti kasir, inventaris, hutang, pengaturan, dan pembacaan laporan dasar. Fondasi backend, auth, dan persistence sudah aktif. Nilai produk sudah terlihat jelas, tetapi beberapa fitur bernilai tinggi seperti input pengeluaran, export PDF, dan WhatsApp real integration masih berada pada tahap placeholder atau belum tersedia di UI.
