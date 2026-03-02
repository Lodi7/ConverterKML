# KML → QGC Plan Converter

Aplikasi web sederhana untuk mengkonversi file GPS track `.kml` menjadi file misi `.plan` yang siap digunakan di **QGroundControl** dengan konfigurasi khusus untuk **ArduRover**.

---

## 🚀 Demo

Buka langsung di browser — tidak perlu install apapun.

> Upload file `.kml` → atur jarak minimum → download `.plan`

---

## ✨ Fitur

- **Upload drag & drop** — seret file KML langsung ke browser
- **Filter jarak minimum** — slider 0–50 meter untuk mengatur kepadatan waypoint
- **Preview statistik** — tampil jumlah titik asli, waypoint hasil filter, dan jarak total jalur
- **Output siap pakai** — format `.plan` langsung bisa di-load ke QGroundControl
- **Offline** — semua proses berjalan di browser, tidak ada data yang dikirim ke server
- **Responsive** — bekerja di desktop maupun mobile/tablet

---

## 📖 Cara Pakai

1. Buka aplikasi di browser
2. Upload file `.kml` (drag & drop atau klik untuk browse)
3. Atur **jarak minimum** antar waypoint menggunakan slider
   - `0m` = ambil semua titik GPS
   - `2m` = rekam waypoint setiap 2 meter (direkomendasikan)
   - `50m` = hanya titik-titik berjarak minimal 50 meter
4. Klik **Convert to .plan**
5. Klik **Download misi_rover.plan**
6. Buka QGroundControl → **Plan View** → **Load from File** → pilih file `.plan`

---

## 📂 Format File

### Input — `.kml`
File KML standar dengan elemen `<LineString>` atau `<Point>`. Mendukung namespace `http://www.opengis.net/kml/2.2`.

Contoh sumber KML yang kompatibel:
- **BasicAirData GPS Logger** (Android)
- **Google Earth**
- **OsmAnd**
- GPS tracker lainnya yang mengekspor format KML

### Output — `.plan`
File JSON format QGroundControl dengan konfigurasi:

| Parameter | Nilai |
|---|---|
| `frame` | `0` (global/absolute) |
| `command` | `16` (MAV_CMD_NAV_WAYPOINT) |
| `firmwareType` | `3` (ArduPilot) |
| `vehicleType` | `2` (Rover) |
| `version` | `2` |

---

## ⚙️ Konfigurasi QGroundControl Setelah Load

Setelah file `.plan` berhasil di-load, pastikan setting berikut di QGC dan ArduRover:

```
WP_RADIUS    = 1–2 meter   (toleransi waypoint tercapai)
CRUISE_SPEED = sesuai kebutuhan
```

---

## 🛠️ Teknologi

- HTML5 + CSS3 + Vanilla JavaScript
- Web API: `DOMParser`, `FileReader`, `Blob`, `URL.createObjectURL`
- Tidak ada dependency eksternal
- Tidak ada backend / server-side processing

---

## 📱 Kompatibilitas Browser

| Browser | Status |
|---|---|
| Chrome / Edge | ✅ |
| Firefox | ✅ |
| Safari (iOS/macOS) | ✅ |
| Samsung Internet | ✅ |

---

## 🌐 Hosting

File tunggal `kml-converter.html` — bisa di-host di mana saja:

- **Netlify Drop** — drag & drop di [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel** — import dari GitHub atau deploy manual
- **GitHub Pages** — push ke repository
- **Cloudflare Pages** — connect ke GitHub

---

## 📝 Catatan

- Altitude dari file KML dipertahankan di waypoint output
- `plannedHomePosition` otomatis diset ke waypoint pertama dengan altitude `0`
- Koordinat yang tidak valid (di luar range lat/lon) otomatis dilewati
- File diproses sepenuhnya di sisi klien — tidak ada data yang diunggah ke server manapun

---

## 📄 Lisensi

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan.
