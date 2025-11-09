Folder ini berisi logo aset dan brand.

Replace (ganti) placeholder dengan file logo asli Anda. Rekomendasi penamaan file (gunakan .jpg atau .png jika Anda mau):
- usdt.jpg (atau usdt.png)
- bnb.jpg
- base.jpg
- sol.jpg
- brand.jpg (logo brand Anda)

Contoh import di React/TSX (jika menggunakan file di `src`):

```ts
import usdtLogo from '../assets/logos/usdt.jpg';
import brandLogo from '../assets/logos/brand.jpg';

<img src={usdtLogo} alt="USDT" />
```

Jika Anda lebih suka meletakkan file di folder `public/`, gunakan path absolut `/logos/usdt.jpg`.

Tips:
- Gunakan versi JPG/PNG untuk gambar raster (foto). Jika butuh resolusi scalable dan ukuran kecil, gunakan SVG.
- Pastikan nama file sesuai (lowercase tanpa spasi) supaya import mudah.
