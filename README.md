# RUPA — Website Online Shop (Frontend)

Toko online statis untuk brand fiktif **RUPA** (benda harian: pakaian, aksesori,
alas kaki, perlengkapan rumah). Seluruhnya HTML + CSS + JavaScript murni —
**tanpa backend, tanpa build tool, tanpa dependensi**.

## Menjalankan

Buka `index.html` langsung di browser, atau jalankan server statis lokal:

```bash
python -m http.server 8788 --bind 127.0.0.1
```

Lalu buka http://127.0.0.1:8788.

## Halaman

| File | Isi |
| --- | --- |
| `index.html` | Beranda: hero, kategori, produk pilihan, cerita studio, keunggulan, ulasan, newsletter |
| `shop.html` | Katalog 12 produk dengan filter kategori, filter diskon, slider harga, pencarian, dan pengurutan |
| `product.html` | Detail produk via `?id=`, galeri, pilih ukuran & warna, jumlah, akordeon info, produk terkait |
| `cart.html` | Keranjang: ubah jumlah, hapus item, kode promo, ringkasan biaya & pengiriman |
| `checkout.html` | Form pengiriman + metode pembayaran, validasi, dan layar sukses pesanan |

## Struktur

```
assets/
  css/styles.css     Design system + semua komponen + responsive
  js/data.js         Data produk, kategori, kode promo, biaya kirim
  js/art.js          Generator ilustrasi produk (SVG data-URI)
  js/main.js         Keranjang, drawer, pencarian, filter, checkout
```

## Fitur

- Keranjang belanja tersimpan di `localStorage` (bertahan setelah reload)
- Drawer keranjang + halaman keranjang, keduanya sinkron
- Wishlist (tombol hati) tersimpan di `localStorage`
- Kode promo contoh: `RUPA10` (10%) dan `HEMAT50` (Rp 50.000)
- Gratis pengiriman otomatis di atas Rp 500.000, dengan progress bar
- Pencarian (overlay di header → halaman toko), filter & sort dengan sinkronisasi URL
- Validasi form checkout, nomor pesanan, dan layar konfirmasi
- Responsif (desktop, tablet, mobile) + menu mobile, drawer, dan modal
- Aksesibilitas dasar: skip link, label ARIA, fokus terlihat, tutup dengan `Esc`

## Mengganti data produk

Semua produk ada di `assets/js/data.js`. Setiap entri mendukung:

```js
{
  id: "kemeja-linen-pantai",   // dipakai di URL product.html?id=...
  name: "Kemeja Linen Pantai",
  category: "pakaian",         // pakaian | alas-kaki | aksesori | rumah
  price: 389000,
  oldPrice: 459000,            // opsional, memunculkan harga coret + badge diskon
  rating: 4.9,
  reviews: 214,
  badge: "Terlaris",           // opsional: "Baru", "Terlaris", dll.
  sizes: ["S", "M", "L", "XL"],
  colors: ["#d8c6ac", "#a8b3a0"],
  desc: "…",
  details: ["…", "…"],
  featured: true,              // tampil di beranda
}
```

### Foto produk asli

Saat ini gambar produk dibuat otomatis sebagai ilustrasi SVG (`assets/js/art.js`),
sehingga tidak ada gambar yang gagal dimuat dan tidak perlu aset biner. Untuk
memakai foto sungguhan, taruh file di `assets/img/` lalu tambahkan properti `img`
pada produk:

```js
img: "assets/img/kemeja-linen.jpg"
```

Jika `img` diisi, ilustrasi otomatis tidak dipakai untuk produk tersebut.

## Catatan

Ini demo antarmuka: tidak ada pembayaran, stok, akun, atau pengiriman email yang
benar-benar diproses. Data keranjang/order hanya ada di browser pengunjung.
