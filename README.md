# 🌿 Rengkuh — Teman Pendamping Refleksi untuk Para Pengasuh

Rengkuh adalah aplikasi web pendamping emosional berbasis percakapan yang dirancang untuk para pengasuh (*caregivers*) di Indonesia — baik ibu, ayah, anak muda, maupun siapapun yang merawat orang tua lansia atau anggota keluarga yang sakit kronis.

Rengkuh hadir untuk memastikan **tidak ada pengasuh yang berjuang sendirian.**

---

## ✨ Fitur

### 💬 Ruang Cerita *(Aktif)*
Ruang curhat berbasis percakapan dengan Rengkuh — teman pendamping yang mendengarkan tanpa menghakimi, memvalidasi kelelahan, dan menyusun **Ringkasan Refleksi Emosi** secara otomatis saat percakapan sudah cukup mendalam.

**Ringkasan Refleksi berisi:**
- 💛 Emosi Dominan yang terdeteksi dari cerita
- 🌱 Kekuatan Diri yang ditemukan
- ✨ Satu Langkah Kecil yang bisa dilakukan hari ini
- 📝 Intisari Hari Ini sebagai pesan validasi emosional

### 🔒 Fitur yang Akan Datang
- **Ruang Rawat** — Penyederhanaan catatan medis dokter menjadi rencana perawatan harian
- **Ruang Dukungan** — Rekomendasi komunitas, layanan kesehatan, dan artikel edukasi

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python + Flask (web server statis ringan) |
| Model Bahasa | Google Gemini API (`gemini-3.5-flash`) |
| Komunikasi AI | Langsung dari browser via REST API (client-side) |

> **Catatan Arsitektur:** Pemanggilan Gemini API dilakukan langsung dari sisi browser (*client-side*), bukan dari backend Flask. Flask hanya bertugas menyajikan file HTML, CSS, JS, dan berkas prompt Markdown.

---

## 📁 Struktur Proyek

```
Perempuan Inovasi/
│
├── app.py                  # Web server Flask (menyajikan file statis)
├── requirements.txt        # Dependensi Python
├── .env                    # Konfigurasi environment (opsional)
│
├── prompts/
│   ├── cerita_system.md    # Instruksi persona & gaya bahasa Rengkuh
│   └── cerita_summary.md   # Skema JSON untuk Ringkasan Refleksi Emosi
│
├── templates/
│   └── index.html          # Satu-satunya halaman HTML (SPA)
│
└── static/
    ├── css/
    │   └── style.css       # Seluruh styling aplikasi
    ├── js/
    │   └── script.js       # Seluruh logika frontend & pemanggilan Gemini API
    └── assets/
        ├── user_avatar.jpg         # Foto profil pengguna di Ruang Cerita
        └── caregiver_illustration.jpg  # Foto ilustrasi di bagian Tentang Kami
```

---

## 🚀 Cara Menjalankan Aplikasi

### Prasyarat
Pastikan sudah terinstal:
- **Python 3.10+**
- **pip**

### 1. Persiapan Lingkungan

Buka terminal di folder proyek, lalu buat dan aktifkan *virtual environment*:

```bash
# Buat virtual environment
python -m venv venv

# Aktifkan (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Aktifkan (Windows CMD)
.\venv\Scripts\activate.bat

# Aktifkan (macOS/Linux)
source venv/bin/activate
```

Instal dependensi:

```bash
pip install -r requirements.txt
```

### 2. Konfigurasi Gemini API Key

Buka berkas **`static/js/script.js`** dan isi API Key Anda langsung di baris paling atas:

```javascript
const GEMINI_API_KEY = "AIzaSy..."; // ← Isi di sini
```

> ⚠️ **Peringatan:** Jangan unggah berkas `script.js` ke repositori publik (seperti GitHub) jika API Key sudah diisi, karena kunci akan terekspos secara publik.

Anda bisa mendapatkan API Key secara gratis di [Google AI Studio](https://aistudio.google.com/).

### 3. Jalankan Aplikasi

```bash
python app.py
```

Buka peramban dan akses: **`http://localhost:5000`**

---

## 💡 Cara Penggunaan

1. Di halaman beranda, klik tombol **"Mulai Bercerita"**
2. Ketik cerita atau keluh kesah di kolom pesan, lalu tekan **Enter** atau klik tombol kirim
3. Rengkuh akan merespons dengan hangat dan penuh empati
4. Setelah beberapa pesan, **Ringkasan Refleksi** akan muncul otomatis di panel kanan
5. Gunakan chip saran di atas kotak pesan untuk memulai percakapan jika bingung harus mulai dari mana
6. Tekan tombol 🎙️ untuk input suara (jika browser mendukung)

---

## ⚠️ Disclaimer

Rengkuh adalah **teman pendamping emosional**, bukan pengganti tenaga medis atau psikolog profesional. Jangan mengandalkan Rengkuh untuk diagnosis medis, resep obat, atau penanganan krisis. Jika Anda membutuhkan bantuan profesional, segera hubungi dokter atau layanan kesehatan mental terdekat.