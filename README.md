# 📝 Minimalist Local-First To-Do List App

Sebuah aplikasi pengelola tugas (*task management*) desktop/web yang mengusung konsep **local-first**, responsif, dan terfokus pada kejelasan antarmuka (*UI clarity*) serta manajemen waktu terintegrasi. 

Aplikasi ini dikembangkan menggunakan **HTML5, CSS3, dan Plain JavaScript**, serta dirancang untuk mudah diintegrasikan dengan *framework* desktop seperti **Tauri**.

---

## 📸 Fitur Utama

- **Antarmuka Responsif & Adaptif**: Menggunakan unit relatif dan fungsi CSS `clamp()` untuk fleksibilitas ukuran di berbagai resolusi layar.
- **Pemisahan Task Berdasarkan Status**:
  - **Ongoing Tasks**: Mendukung kontrol pengatur waktu (*timer/stopwatch*), opsi *edit*, dan menu dropdown aksi.
  - **Completed Tasks**: Tampilan bersih tanpa menu pengalih perhatian, dilengkapi badge indikator dan tombol aksi cepat hapus.
- **Sistem Catatan Fleksibel**:
  - *Short Description* untuk ringkasan di bawah judul tugas.
  - Badge khusus `📝 Ada Catatan` yang otomatis muncul jika tugas memiliki deskripsi detail (*Long Description*).
- **Pengatur Waktu & Notifikasi Lokal**:
  - Notifikasi browser terintegrasi tanpa *polling* berulang (menggunakan pengecekan status izin `default`).
  - Penanganan notifikasi fallback jika izin diblokir atau tidak didukung.
- **Penyimpanan Lokal (Local-First)**: Semua data tugas dan konfigurasi tersimpan secara presisten di `localStorage`.

---

## 🧠 Dynamic Thought Process & Arsitektur Pengembangan

Progres pengembangan aplikasi ini dieksekusi melalui tahapan yang berurutan dan terstruktur:

### 1. Fondasi Lingkungan Jalur Lokal & Browser API
- **Tantangan**: Pemanggilan API Notifikasi Browser (`Notification.requestPermission()`) langsung pada skrip utama menyebabkan browser terus menanyakan izin setiap kali halaman di-refresh ketika diakses via protokol `file:///`.
- **Solusi**: 
  - Mengubah logika pengecekan status izin Notifikasi menjadi hanya berjalan ketika status berada pada kondisi `'default'`.
  - Mengalihkan eksekusi lingkungan pengembangan dari sistem file langsung ke **Local Web Server** menggunakan **VS Code Port Forwarding** (HTTPS Tunneling). Hal ini memastikan kredensial dan izin browser tersimpan secara permanen pada *origin* yang valid.

### 2. Refactoring Antarmuka & Responsivitas CSS
- **Tantangan**: Tampilan form/modal dan tombol tambah (`+`) mengalami regresi visual (*alignment* dan kontras warna hilang), serta jarak antar *input box* yang saling berdempetan.
- **Solusi**:
  - Mengatur ulang tata letak `.header-container` menggunakan Flexbox agar elemen judul `My To-Do List` bersandingan rapi dengan tag *author* `by ken`, serta mempertahankan tombol `+` dengan kontras tinggi (lingkaran hitam ikon putih).
  - Menambahkan pembatasan spasi vertikal (`margin-bottom: 12px;`) secara konsisten pada semua elemen `<input>`, `<textarea>`, dan `<select>` di dalam modal form.

### 3. Presisi Visual & Tata Letak Task Selesai
- **Tantangan**:
  - Posisi garis coret (*strikethrough*) pada tugas yang selesai tidak berada di tengah teks (*off-center*).
  - Menu aksi berulang (dropdown titik tiga) di daftar tugas yang sudah selesai membuat antarmuka terasa ramai.
- **Solusi**:
  - Menyelaraskan teks menggunakan `line-height: 1.4` dan `vertical-align: middle` (atau pendekatan *pseudo-element* kustom) untuk memastikan posisi garis tepat di tengah-tengah font.
  - Menghilangkan elemen dropdown `⋮` pada tugas di kategori **Task Selesai**.
  - Merancang ulang *right section* pada tugas selesai sehingga tombol **Hapus** langsung diposisikan di paling pojok kanan, tepat di sebelah badge `📝 Ada Catatan`.

### 4. Manajemen Autentikasi & Version Control
- **Tantangan**: Saat mengisikan perubahan ke *remote repository* GitHub, muncul *prompt* pemilihan Git Credential Helper Windows.
- **Solusi**: Mengonfigurasi Git menggunakan `manager-core` (*Git Credential Manager Core*) sebagai standar manajemen identitas yang terhubung langsung dengan Windows Credential Manager.

---

## 🛠️ Port Forwarding & Jalankan Secara Lokal

Untuk memastikan fitur **Notification API** dan **LocalStorage** berjalan tanpa kendala keamanan browser, jalankan project menggunakan server lokal:

### Menggunakan VS Code Port Forwarding
1. Buka folder project di **VS Code**.
2. Jalankan server lokal (misalnya menggunakan extension **Live Server** di port `5500`).
3. Buka tab **Ports** di panel bawah VS Code (di sebelah tab *Terminal*).
4. Klik **Forward a Port**, ketik `5500`, lalu tekan **Enter**.
5. Ubah **Port Visibility** menjadi **Public**.
6. Gunakan URL `https://...` yang dihasilkan untuk menguji aplikasi di browser.

---

## 🗂️ Struktur Proyek

```text
.
├── index.html          # Struktur DOM utama dan modal input
├── styles.css          # Styling kustom, layout responsif, dan komponen UI
├── app.js              # State management, logika render, dan penanganan Notifikasi
└── README.md           # Dokumentasi proyek
