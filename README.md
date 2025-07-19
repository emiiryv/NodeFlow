# 🌐 NodeFlow

**NodeFlow**, dosya barındırma ve video streaming altyapısı sunan modern bir Node.js tabanlı web uygulamasıdır.  
Projede Azure Blob Storage, akıllı video yükleme, indirme logları, sıkıştırma ve gerçek zamanlı streaming gibi gelişmiş özellikler desteklenmektedir.

---

## 🚀 Özellikler

### 📁 Dosya Hosting
- Azure Blob Storage entegrasyonu
- `multer` üzerinden dosya yükleme (REST API)
- Metadata kaydı (boyut, format, kullanıcı vs.)
- .env ile güvenli yapılandırma

### 🎥 Video Streaming
- Akıllı video başlangıcı (range header destekli)
- `ffmpeg` ile meta segment analizi
- Video erişim logları (IP, tarih, süre, kullanıcı)

### 🧩 Dosya Yükleme Optimizasyonu
- Büyük dosyalar için sıkıştırma (`sharp`, `ffmpeg`)
- Gereksiz blob temizleme (mapping tablosu ile)
- Sadece veritabanında eşleşen blob’lar saklanır

### 🧑‍💻 Kullanıcı & İstatistik Yönetimi
- Dosya açılma/tıklanma istatistikleri
- İndirme bilgileri: tarih, IP, kullanıcı agent
- Admin için erişim geçmişi

### 🎦 2. Aşama (yakında)
- Gerçek zamanlı video streaming (WebRTC)
- Ekran paylaşımı ve odalı video görüşme desteği

---

## 🧱 Teknolojiler

| Alan                | Kullanılan Teknoloji               |
|---------------------|------------------------------------|
| Backend             | Node.js, Express.js                |
| Frontend            | React + TypeScript                 |
| Storage             | Azure Blob Storage                 |
| Database            | PostgreSQL                         |
| Video İşleme        | ffmpeg, fluent-ffmpeg              |
| Upload              | multer                             |
| Logging             | winston, morgan                    |
| Auth (opsiyonel)    | JWT / OAuth (entegre edilebilir)  |

---

## 📦 Kurulum

### 🖥️ Backend
```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını doldurmayı unutma
npm start
```

### 🌐 Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

---

## 📁 Proje Yapısı

```
NodeFlow/
├── backend/
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   └── models/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   └── api/
├── .gitignore
├── README.md
└── ...
```

---

## 🛡️ Güvenlik Notları

- `.env` dosyaları Git’e dahil edilmemelidir.
- Azure key, database şifreleri gibi hassas bilgiler `.env` ile saklanmalıdır.
- Production ortamı için `https`, rate-limit, auth kontrolü önerilir.

---
