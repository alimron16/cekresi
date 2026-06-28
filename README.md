# MBRESI - Unified Cek Resi API Middleware

API Middleware modern untuk melakukan pelacakan resi (package tracking) multi-kurir secara otomatis. Mendukung kurir **JNE**, **J&T (JNT)**, **SiCepat**, dan kerangka awal untuk **Lion Parcel**.

---

## Fitur Utama

1. **JNE Parser**: Pelacakan cepat menggunakan HTTP GET murni dengan parameter verifikasi.
2. **J&T (JNT) Parser**: Pelacakan menggunakan HTTP POST langsung dengan kalkulasi tanda tangan digital (`pId` dan `pst`) secara programmatic (Ringan & Tanpa Puppeteer).
3. **SiCepat Parser**: Pelacakan otomatis penuh menggunakan Puppeteer (Headless Shell) untuk melewati proteksi reCAPTCHA v3 secara otomatis di latar belakang.
4. **Unified Output**: Hasil data pelacakan diseragamkan ke dalam satu struktur JSON yang sama untuk semua kurir.
5. **Detailed Logging**: Logging lengkap setiap request masuk dan progress pelacakan di terminal.

---

## Panduan Instalasi (Development & Production Server)

### 1. Klon / Unggah Berkas
Unggah seluruh berkas proyek ke direktori server Anda (misalnya di `/www/wwwroot/cekresi` pada aaPanel).

### 2. Jalankan Instalasi Dependency
Buka terminal proyek Anda dan jalankan perintah:
```bash
npm install
```

### 3. Khusus Linux/aaPanel: Instal Library Dependensi Chrome
Jika Anda men-deploy proyek ini di Linux, instal dependensi sistem operasi berikut agar engine Chrome headless dapat berjalan lancar:

* **Ubuntu/Debian:**
  ```bash
  sudo apt-get update
  sudo apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release xdg-utils wget
  ```
* **CentOS/AlmaLinux:**
  ```bash
  sudo yum install -y alsa-lib atk cups-libs dbus-glib expat fontconfig glib2 gtk3 libX11 libXcomposite libXcursor libXdamage libXext libXfixes libXi libXrandr libXrender libXscrnsaver libXtst pango redhat-lsb-core xorg-x11-server-Xvfb xorg-x11-xauth liberation-mono-fonts liberation-sans-fonts liberation-serif-fonts
  ```

### 4. Unduh Engine Headless Chrome
Jalankan perintah ini di terminal proyek Anda untuk mengunduh browser headless secara lokal:
```bash
PUPPETEER_CACHE_DIR=.cache/puppeteer npx puppeteer browsers install chrome-headless-shell
```

*Jika dijalankan di aaPanel/Linux, jangan lupa sesuaikan kepemilikan foldernya agar bisa dibaca oleh server web `www`:*
```bash
sudo chown -R www:www .cache
```

### 5. Jalankan Aplikasi
Jalankan server menggunakan NPM script:
```bash
npm start
```
Secara default, aplikasi akan berjalan pada port **3004** (atau port yang disetel di environment).

---

## Dokumentasi API (Endpoints)

### 1. Cek Status Server / Indeks Utama
* **Endpoint:** `GET /`
* **Response Contoh:**
  ```json
  {
    "message": "Welcome to MBRESI",
    "supportedCouriers": ["jne", "jnt", "lion", "sicepat"],
    "usage": {
      "jne": "/api/track?courier=jne&resi=RESI_NUMBER&verify=LAST_5_DIGITS_OF_RECEIVER_PHONE",
      "jnt": "/api/track?courier=jnt&resi=RESI_NUMBER&verify=LAST_4_DIGITS_OF_RECEIVER_PHONE",
      "sicepat": "/api/track?courier=sicepat&resi=RESI_NUMBER&verify=LAST_5_DIGITS_OF_RECEIVER_PHONE",
      "lion": "/api/track?courier=lion&resi=RESI_NUMBER"
    }
  }
  ```

---

### 2. Pelacakan Paket
* **Endpoint:** `GET /api/track`
* **Query Parameters:**

| Parameter | Wajib | Keterangan | Contoh |
| :--- | :--- | :--- | :--- |
| `courier` | Ya | Kode kurir (`jne`, `jnt`, `sicepat`, `lion`) | `sicepat` |
| `resi` | Ya | Nomor resi paket | `004612282741` |
| `verify` | Ya (JNE/JNT/SiCepat) | Kode verifikasi nomor HP penerima | `26320` |

> [!NOTE]
> * **JNE** membutuhkan 5 digit terakhir nomor HP penerima.
> * **J&T (JNT)** membutuhkan 4 digit terakhir nomor HP penerima/pengirim.
> * **SiCepat** membutuhkan 5 digit terakhir nomor HP penerima.

---

## Contoh Integrasi Frontend (JavaScript Fetch)

Berikut adalah contoh script JavaScript sederhana yang bisa Anda pasang di halaman website Anda untuk memanggil API ini dan menampilkan hasilnya:

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Cek Resi Widget</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, button { width: 100%; padding: 10px; box-sizing: border-box; margin-top: 5px; }
        button { background: #AF272C; color: white; border: none; cursor: pointer; font-weight: bold; }
        button:hover { background: #8C1F23; }
        #result { margin-top: 20px; padding: 15px; border: 1px solid #ddd; display: none; background: #f9f9f9; }
        .history-item { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #eee; }
        .current { font-weight: bold; color: green; }
    </style>
</head>
<body>

    <h2>Lacak Pengiriman Barang</h2>
    
    <div class="form-group">
        <label for="courier">Pilih Kurir:</label>
        <select id="courier">
            <option value="jne">JNE</option>
            <option value="jnt">J&T Express</option>
            <option value="sicepat">SiCepat</option>
        </select>
    </div>

    <div class="form-group">
        <label for="resi">Nomor Resi:</label>
        <input type="text" id="resi" placeholder="Masukkan nomor resi...">
    </div>

    <div class="form-group">
        <label for="verify">Digit Verifikasi HP Penerima:</label>
        <input type="text" id="verify" placeholder="4 digit untuk J&T / 5 digit untuk JNE & SiCepat">
    </div>

    <button onclick="lacakPaket()">Lacak Paket</button>

    <div id="result"></div>

    <script>
        async function lacakPaket() {
            const courier = document.getElementById('courier').value;
            const resi = document.getElementById('resi').value;
            const verify = document.getElementById('verify').value;
            const resultDiv = document.getElementById('result');

            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<em>Sedang melacak paket Anda...</em>';

            try {
                // Sesuaikan alamat IP & port API dengan alamat server Anda
                const apiUrl = `http://localhost:3004/api/track?courier=${courier}&resi=${resi}&verify=${verify}`;
                
                const response = await fetch(apiUrl);
                const resJson = await response.json();

                if (!resJson.success) {
                    resultDiv.innerHTML = `<span style="color: red;">Gagal: ${resJson.message}</span>`;
                    return;
                }

                const data = resJson.data;
                let html = `
                    <h3>Hasil Pelacakan (${data.courier})</h3>
                    <p><strong>No Resi:</strong> ${data.resi}</p>
                    <p><strong>Status:</strong> ${data.status}</p>
                    <p><strong>Layanan:</strong> ${data.service}</p>
                    <p><strong>Penerima:</strong> ${data.receiver.name} (${data.receiver.city})</p>
                    <hr>
                    <h4>Riwayat Perjalanan:</h4>
                `;

                data.history.forEach(item => {
                    html += `
                        <div class="history-item ${item.isCurrent ? 'current' : ''}">
                            <small>${item.date}</small><br>
                            ${item.description}
                        </div>
                    `;
                });

                resultDiv.innerHTML = html;

            } catch (err) {
                resultDiv.innerHTML = `<span style="color: red;">Error: ${err.message}</span>`;
            }
        }
    </script>
</body>
</html>
```
