# 🌐 NodeFlow

**NodeFlow**, dosya barındırma ve video streaming altyapısı sunan, tenant bazlı çok kullanıcılı mimariye sahip modern bir Node.js tabanlı web uygulamasıdır.  
Projede Azure Blob Storage, akıllı video yükleme, indirme logları, sıkıştırma ve gerçek zamanlı streaming gibi gelişmiş özellikler desteklenmektedir.  
Ayrıca hem admin hem de tenant yöneticileri için özel bir panel arayüzü sunar.

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

### 🖥️ Backend Kurulumu
```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını aşağıdaki örneğe göre doldurun
npx prisma migrate dev --name init
npm start
```

### 🌐 Frontend Kurulumu
```bash
cd frontend
npm install
cp .env.example .env
# FRONTEND_URL ve REACT_APP_API_URL değerlerini backend'e göre ayarlayın
npm start
```

### 🌍 .env Örneği
```env
PORT=3000
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=...;AccountName=...;AccountKey=...;
AZURE_CONTAINER_NAME=nodeflow
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_DATABASE=nodeflow
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/nodeflow
FRONTEND_URL=http://localhost:3001
JWT_SECRET=supersecretkey
```

---

## 🗄️ Veritabanı ve Prisma

> Not: PostgreSQL veritabanını manuel olarak oluşturmanız gerekir. Aşağıdaki SQL komutu ile yeni bir veritabanı oluşturabilirsiniz:
```sql
CREATE DATABASE nodeflow;
```
Ardından `.env` dosyasındaki `DATABASE_URL` değeri bu veritabanına uygun şekilde ayarlanmalıdır.

### 🧬 Role Enum:
- `user`, `tenantadmin`, `admin` rolleri desteklenmektedir.

### 🧩 Tablolar:
- `user`: kullanıcı bilgileri (username, email, password, role)
- `tenant`: tenant adları ve ilişkili kullanıcı/dosyalar
- `file`: dosya bilgileri ve ilişkili kullanıcı/tenant
- `video`: video metadata (format, süre, çözünürlük)
- `access_log`: erişim zamanı, IP ve kullanıcı ajanı

### 🔧 Gerekli Komutlar:
```bash
npx prisma generate        # Prisma client oluştur
npx prisma migrate dev     # Veritabanı tablolarını oluştur
npx prisma studio          # Veritabanını görsel olarak görüntüle (opsiyonel)
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
