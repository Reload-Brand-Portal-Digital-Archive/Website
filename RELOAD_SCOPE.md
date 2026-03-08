# RELOAD Distro — AI Context & Project Scope

> **Untuk AI di IDE:** Baca file ini sebelum membantu developer. Ini adalah sumber kebenaran tunggal (single source of truth) untuk proyek ini. Jangan asumsikan hal-hal yang tidak tercantum di sini.

---

## 🎯 Apa Proyek Ini?

**RELOAD Distro** adalah sebuah **Web CMS (Content Management System)** untuk brand clothing lokal berbasis konsep *limited edition*. Website ini **BUKAN toko online** — tidak ada keranjang belanja, tidak ada checkout, tidak ada payment gateway.

**Fungsi utama website:**
1. Menampilkan arsip katalog produk yang pernah dirilis
2. Menjadi landing page resmi brand
3. Mengarahkan traffic ke Shopee & TikTok Shop (redirect)
4. Menerima form kontak dari calon pembeli grosir
5. Menyimpan data analytics pengunjung secara self-hosted (native, tanpa Google Analytics)

---

## ⚠️ ATURAN KRITIS — Jangan Pernah Dilanggar

```
1. TIDAK ADA fitur transaksi/checkout. Tombol beli = redirect ke Shopee/TikTok.
2. Tracking klik WAJIB disimpan ke DB dulu, BARU redirect ke link eksternal.
3. Analitik HARUS native/self-hosted. DILARANG menggunakan Google Analytics atau layanan tracking pihak ketiga apapun.
4. Admin panel HANYA untuk Super Admin. Validasi JWT wajib di dua lapis: frontend (protected route) dan backend (middleware).
5. JWT WAJIB disimpan di httpOnly cookie. DILARANG menyimpan token di localStorage atau sessionStorage.
```

---

## 👥 Tipe Pengguna & Hak Akses

| Role | Akses | Keterangan |
|---|---|---|
| `guest` | Halaman publik saja | Tidak login, bisa lihat katalog & klik link |
| `user` | Publik + Newsletter | Akun terdaftar, bisa subscribe newsletter |
| `admin` | Admin Panel penuh | Super Admin, akses via JWT yang divalidasi |

> **Catatan untuk AI:** Kolom `role` ada di tabel `users`. Saat membuat middleware atau protected route, selalu cek `role === 'admin'`.

---

## 🗂️ Status Proyek Saat Ini

### ✅ Sudah Ada & Siap
- **Database MySQL** (`reload_db`): Semua 9 tabel sudah terbentuk dan siap digunakan
- **Backend (Node.js + Express v5)**: Struktur MVC sudah rapi, dependency inti sudah terpasang
- **Frontend (React 19 + Vite)**: Scaffold dasar sudah ada, routing & axios sudah terpasang, Tailwind CSS 4 sudah terintegrasi

### 🔧 Belum Ada / Perlu Dibangun
- Semua komponen React UI (belum ada sama sekali di `src/`)
- Semua file controller, model, dan route di backend (struktur folder ada, isinya belum)
- Logic JWT & Google OAuth
- Middleware tracking

---

## 🏗️ Tech Stack

| Layer | Teknologi | Versi/Catatan |
|---|---|---|
| Frontend | React.js | v19, dengan Vite |
| Styling | Tailwind CSS | v4 |
| Routing (FE) | React Router DOM | Sudah terpasang |
| HTTP Client | Axios | Sudah terpasang |
| Backend | Node.js + Express.js | Express v5 |
| Database | MySQL | Library: `mysql2` |
| Auth | JWT + Google OAuth 2.0 | `jsonwebtoken` + `bcryptjs` sudah terpasang |
| Upload File | Multer | Sudah terpasang, folder `uploads/` sudah ada |
| Cloud Storage | Cloudinary | Opsional, sebagai alternatif Multer |
| Env Config | dotenv | Sudah terpasang |

---

## 📁 Struktur Folder Proyek

```
reload-distro/
├── backend/
│   ├── controllers/        # Logic bisnis per fitur
│   ├── middlewares/        # Auth JWT, tracking, error handler
│   ├── models/             # Query ke MySQL (pola MVC)
│   ├── routes/             # Definisi endpoint API
│   ├── uploads/            # File gambar yang diupload via Multer
│   └── server.js           # Entry point backend
│
└── frontend/
    └── src/
        ├── assets/
        ├── App.jsx          # Root component + setup router
        └── main.jsx         # Entry point React
        # Belum ada folder: components/, pages/, hooks/, contexts/
```

---

## 🗄️ Skema Database (`reload_db`)

> **Catatan untuk AI:** Semua tabel menggunakan `InnoDB`. Selalu gunakan prepared statements / parameterized query saat berinteraksi dengan DB.

### `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `user_id` | INT PK | Auto increment |
| `name` | VARCHAR | Nama pengguna |
| `email` | VARCHAR UNIQUE | Email (login identifier) |
| `password` | VARCHAR nullable | Null jika login via Google |
| `google_id` | VARCHAR nullable | Null jika login manual |
| `role` | ENUM('user','admin') | Default: 'user' |
| `created_at` | TIMESTAMP | |

### `collections`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `collection_id` | INT PK | |
| `name` | VARCHAR | Nama koleksi (misal: "Rave 2024") |
| `slug` | VARCHAR UNIQUE | URL-friendly identifier |
| `description` | TEXT | |
| `year` | YEAR | Tahun rilis koleksi |
| `cover_image` | VARCHAR | Path/URL gambar cover |
| `created_at` | TIMESTAMP | |

### `products`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `product_id` | INT PK | |
| `collection_id` | INT FK → collections | |
| `name` | VARCHAR | |
| `slug` | VARCHAR UNIQUE | |
| `description` | TEXT | |
| `category` | VARCHAR | Kaos, hoodie, dll |
| `sizes` | JSON / VARCHAR | Ukuran tersedia (S, M, L, XL) |
| `status` | ENUM('available','sold_out') | |
| `sort_order` | INT | Urutan tampil di halaman publik |
| `created_at` | TIMESTAMP | |

### `product_images`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `image_id` | INT PK | |
| `product_id` | INT FK → products | |
| `image_path` | VARCHAR | Path Multer atau URL Cloudinary |
| `is_primary` | BOOLEAN | Foto utama untuk thumbnail |
| `sort_order` | INT | Urutan tampil di galeri |

### `page_views`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `page_view_id` | INT PK | |
| `user_id` | INT FK nullable → users | Null jika guest |
| `url` | VARCHAR | Halaman yang dikunjungi |
| `ip_address` | VARCHAR | |
| `user_agent` | TEXT | |
| `created_at` | TIMESTAMP | |

### `link_clicks`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `click_id` | INT PK | |
| `user_id` | INT FK nullable → users | Null jika guest |
| `platform` | ENUM('shopee','tiktok') | |
| `ip_address` | VARCHAR | |
| `created_at` | TIMESTAMP | |

### `newsletter_subscribers`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `newsletter_id` | INT PK | |
| `user_id` | INT FK nullable → users | Null jika subscribe tanpa akun |
| `email` | VARCHAR UNIQUE | |
| `created_at` | TIMESTAMP | |

### `contact_messages`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `message_id` | INT PK | |
| `user_id` | INT FK nullable → users | Null jika tidak login |
| `name` | VARCHAR | |
| `email` | VARCHAR | |
| `phone` | VARCHAR | Nomor WhatsApp |
| `inquiry_type` | ENUM('grosir','kolaborasi','lainnya') | |
| `message` | TEXT | |
| `address` | TEXT nullable | Wajib diisi jika inquiry_type = 'grosir' |
| `product_name` | VARCHAR nullable | Wajib diisi jika inquiry_type = 'grosir' |
| `quantity` | INT nullable | Min. 12 pcs untuk grosir |
| `message_status` | ENUM('unread','read','done') | Default: 'unread' |
| `created_at` | TIMESTAMP | |

### `site_settings`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `setting_id` | INT PK | |
| `key` | VARCHAR UNIQUE | Identifier pengaturan |
| `value` | TEXT | Nilai pengaturan |
| `updated_at` | TIMESTAMP | |

> **Contoh key yang ada:** `shopee_url`, `tiktok_url`, `hero_headline`, `hero_subheadline`, `whatsapp_number`, `contact_email`

---

## 🌐 Routing & API Endpoints

### Frontend Routes (React Router)

| Path | Akses | Komponen |
|---|---|---|
| `/` | Publik | Landing Page |
| `/collections` | Publik | Daftar semua koleksi |
| `/collections/:slug` | Publik | Detail satu koleksi |
| `/shop` | Publik | Halaman redirect ke Shopee/TikTok |
| `/contact` | Publik | Form kontak grosir |
| `/register` | Publik | Registrasi akun |
| `/login` | Publik | Login user & admin |
| `/admin/*` | **Protected (Admin)** | Admin Panel |
| `/admin/products` | Protected | Manajemen produk & koleksi |
| `/admin/analytics` | Protected | Dashboard analytics |
| `/admin/newsletter` | Protected | Manajemen subscriber |
| `/admin/messages` | Protected | Inbox pesan grosir |
| `/admin/settings` | Protected | Pengaturan sistem |

### Backend API Endpoints (Base: `/api`)

| Endpoint | Method | Auth | Keterangan |
|---|---|---|---|
| `/auth/register` | POST | Publik | Daftar akun baru |
| `/auth/login` | POST | Publik | Login, return JWT di httpOnly cookie |
| `/auth/google` | GET | Publik | Inisiasi Google OAuth 2.0 |
| `/auth/logout` | POST | Publik | Hapus cookie JWT |
| `/collections` | GET | Publik | Daftar semua koleksi |
| `/collections/:slug` | GET | Publik | Detail koleksi + produknya |
| `/products` | GET | Publik | Daftar semua produk (dengan filter) |
| `/products/:slug` | GET | Publik | Detail produk + gambar |
| `/track/pageview` | POST | Publik | Catat page view ke DB |
| `/track/click/:platform` | POST | Publik | **Catat klik dulu ke DB, BARU kirim URL tujuan** |
| `/contact` | POST | Publik | Kirim pesan kontak grosir |
| `/newsletter/subscribe` | POST | Publik | Subscribe newsletter |
| `/admin/products` | GET/POST | **Admin JWT** | Manajemen produk |
| `/admin/products/:id` | PUT/DELETE | **Admin JWT** | Edit/hapus produk |
| `/admin/collections` | GET/POST/PUT/DELETE | **Admin JWT** | Manajemen koleksi |
| `/admin/analytics/summary` | GET | **Admin JWT** | Data ringkasan analytics |
| `/admin/messages` | GET | **Admin JWT** | Daftar pesan masuk |
| `/admin/messages/:id` | GET/PUT/DELETE | **Admin JWT** | Detail & update status pesan |
| `/admin/newsletter` | GET/DELETE | **Admin JWT** | Kelola subscriber |
| `/admin/settings` | GET/PUT | **Admin JWT** | Baca & ubah site settings |

---

## 🔒 Mekanisme Autentikasi

### JWT
- Token diterbitkan oleh backend saat login berhasil
- **Disimpan di `httpOnly` cookie** — tidak boleh di `localStorage`
- Payload JWT berisi: `{ userId, role, email }`
- Setiap request ke endpoint `/admin/*` wajib melewati middleware `verifyToken` + `requireAdmin`

### Google OAuth 2.0
- Menggunakan library `passport-google-oauth20` atau `googleapis`
- Jika email belum ada di DB → buat baris baru di `users` (password = null, google_id = diisi)
- Jika email sudah ada → login langsung, update `google_id` jika belum ada
- Setelah berhasil → terbitkan JWT, set di httpOnly cookie, redirect ke frontend

---

## 📊 Mekanisme Tracking Analytics (Native/Self-Hosted)

### Page View Tracking
Karena React menggunakan SPA routing (tidak ada request HTTP ke server saat pindah halaman), tracking dilakukan dari sisi frontend:

```
useEffect di setiap halaman atau di router listener
  → kirim POST ke /api/track/pageview
  → backend simpan ke tabel page_views
```

### Link Click Tracking (CRITICAL FLOW)
**Urutan wajib — JANGAN dibalik:**

```
User klik tombol Shopee/TikTok
  → Frontend kirim POST ke /api/track/click/shopee (atau /tiktok)
  → Backend simpan ke tabel link_clicks
  → Backend response: { url: "https://shopee.co.id/..." }
  → Frontend buka URL tersebut di tab baru (window.open)
```

---

## 🗓️ Sprint Plan & Progress

| Sprint | Fokus | Status |
|---|---|---|
| **Sprint 1** | Setup project, migrasi DB, Landing Page | 🟡 DB sudah ada, UI belum |
| **Sprint 2** | Product CRUD, Auth (JWT + Google SSO) | ⬜ Belum dimulai |
| **Sprint 3** | Shop Page, Page View & Click Tracking Middleware | ⬜ Belum dimulai |
| **Sprint 4** | Newsletter Subscribe, Analytics Dashboard | ⬜ Belum dimulai |
| **Sprint 5** | Site Settings, Manajemen Pesan Grosir | ⬜ Belum dimulai |

**Legend:** ✅ Selesai | 🟡 Sedang berjalan / Sebagian | ⬜ Belum dimulai

---

## 📋 Fitur Requirements Ringkas

### Halaman Publik
- **Landing Page:** Hero banner, featured collections (3-4 item), about brand, CTA ke Shop, newsletter signup
- **Collections:** Grid produk, filter (kategori/tahun/status), search, badge "Sold Out", grouping per koleksi
- **Shop:** Kartu Shopee + TikTok dengan click tracking, URL diambil dari `site_settings`
- **Contact:** Form grosir dengan field kondisional (alamat, nama produk, kuantitas muncul hanya jika `inquiry_type = grosir'`)
- **Register/Login:** Form manual + tombol "Login with Google"

### Admin Panel (Protected)
- **Dashboard Analytics:** Total page views, unique visitors, klik Shopee & TikTok, total users, total subscribers — semua dengan filter periode (Hari ini / 7 hari / 30 hari / custom)
- **Produk & Koleksi:** CRUD lengkap, multi-upload gambar, toggle status Available/Sold Out, drag-and-drop sort order
- **Newsletter:** Tabel subscriber, export CSV, hapus subscriber
- **Pesan Masuk:** Inbox, detail pesan, update status (unread/read/done), badge notifikasi di sidebar
- **Settings:** Form untuk ubah link Shopee, TikTok, teks hero, nomor WA, ganti password admin

---

## 🎨 Design System

- **Estetika:** Streetwear, vivid/bold colors, tidak monoton — mencerminkan brand limited-edition
- **Responsive:** Mobile-first, harus berjalan baik di HP dan desktop
- **Font:** Bebas disesuaikan, tapi harus modern dan tegas (sesuai karakter streetwear)

---

## 🚫 Out of Scope (Jangan Diimplementasikan)

- ❌ Keranjang belanja / cart
- ❌ Checkout / payment gateway
- ❌ Sistem order online
- ❌ Google Analytics atau analytics pihak ketiga
- ❌ Email marketing otomatis (newsletter blast) — hanya simpan subscriber, blast dilakukan manual via tool eksternal
- ❌ Role selain `user` dan `admin`
- ❌ Multi-admin / permission system
