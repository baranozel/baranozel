# BAKI BARAN ÖZEL — studio site (Milestone 2 · v2)

Çalıştırmak için:  `python3 -m http.server 8000`  →  http://localhost:8000
(ES modülleri kullanıldığı için dosyayı doğrudan çift tıklayarak açma.)

## Proje görüntüleyici (İŞLER bölümü)
Canlı adresleri **sadece `js/projects.js`** içinde değiştir:

    { id: 'irem-erdurmaz', title: 'İREM ERDURMAZ', category: 'FİZYOTERAPİST / WEB SİTESİ',
      url: 'PASTE_PROJECT_URL_HERE' }   // → 'https://gercek-adres.com'

- `url` http/https değilse görüntüleyici "adres henüz eklenmedi" der ve iframe açmaz.
- iframe yalnızca projeye tıklanınca oluşur, kapanınca silinir.
- Bazı siteler (X-Frame-Options / CSP) başka bir sayfanın içinde açılmayı engeller.
  Bu engeli aşmaya çalışmıyoruz; "SİTEYİ AYRI SEKMEDE AÇ" düğmesi her zaman var.
- Yeni bir satırı tıklanabilir yapmak için `js/projects.js`'e kayıt ekle,
  `index.html`'de o satırın başlığını `<button class="proj-btn" data-project="ID">` ile sar.

## Diğer yer tutucular
- WhatsApp numarası / e-posta: `index.html` → `#iletisim` (TODO yorumu), `.act-ph` satırlarını sil
- Fotoğraf: `index.html` → `#hakkimda` (`.ph-box` yerine `<img>`)
- Proje görselleri ve yıllar: `index.html` → `#isler` (`[YIL]`, `[GÖRSEL EKLENECEK]`, Proje 03 / 04)
