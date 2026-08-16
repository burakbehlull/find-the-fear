# Babadook - AI Destekli Film Öneri Platformu

Modern, minimalist ve karanlık temalı film öneri platformu. Kullanıcıların izlediği filmleri takip eder ve Gemini AI kullanarak kişiselleştirilmiş önerilerde bulunur.

## 🎬 Özellikler

- **AI Destekli Öneriler**: Google Gemini API ile güçlendirilmiş akıllı film önerileri
- **Kişiselleştirilmiş Deneyim**: İzlediğiniz filmlere göre özel öneriler
- **Akıllı Filtreleme**: Daha önce izlediğiniz filmler tekrar önerilmez
- **Kullanıcı Paneli**: Film ekleme, görüntüleme ve yönetme
- **Modern Dark UI**: Minimalist ve şık karanlık tema
- **Glassmorphism**: Modern cam efekti tasarım
- **Güvenli Kimlik Doğrulama**: JWT tabanlı güvenli giriş sistemi

## 🎨 Tasarım

- **Modern Dark Theme**: Siyah arka plan (#0a0a0a)
- **Glassmorphism Effects**: Cam efektli kartlar
- **Gradient Accents**: Purple, pink ve yellow gradyanlar
- **Font Weight**: Ultra light (font-light) modern tipografi
- **Smooth Animations**: Akıcı geçişler ve hover efektleri

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+ 
- MongoDB (yerel veya cloud)
- Google Gemini API Key

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **.env.local dosyasını düzenleyin:**
```env
MONGODB_URI=mongodb://localhost:27017/babadook
JWT_SECRET=your-secret-key-change-in-production
GEMINI_API_KEY=your-gemini-api-key-here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. **MongoDB'yi başlatın:**
```bash
# Windows için
net start MongoDB

# Linux/Mac için
sudo systemctl start mongodb
```

4. **Development sunucusunu başlatın:**
```bash
npm run dev
```

5. **Tarayıcıda açın:**
```
http://localhost:3000
```

## 📁 Proje Yapısı

```
babadook-movie-app/
├── app/
│   ├── api/
│   │   ├── auth/          # Kimlik doğrulama endpoints
│   │   ├── movies/        # Film yönetimi endpoints
│   │   └── recommendations/ # Öneri endpoints
│   ├── userpanel/         # Kullanıcı paneli sayfası
│   ├── recommendations/   # Öneri sayfası
│   ├── layout.js          # Root layout
│   └── page.js            # Ana sayfa
├── components/
│   ├── ui/                # UI componentleri
│   ├── Navbar.jsx         # Navigation bar
│   └── AuthDialog.jsx     # Login/Register dialog
├── lib/
│   ├── auth.js            # JWT işlemleri
│   ├── mongodb.js         # Database bağlantısı
│   ├── gemini.js          # AI öneri sistemi
│   └── utils.js           # Yardımcı fonksiyonlar
└── models/
    ├── User.js            # Kullanıcı modeli
    └── Movie.js           # Film modeli
```

## 🎯 Kullanım

### 1. Kayıt Olma
- Ana sayfada "Kayıt Ol" butonuna tıklayın
- Kullanıcı adı, e-posta ve şifre girin
- Otomatik olarak giriş yapılır

### 2. Film Ekleme
- "Panelim" sayfasına gidin
- "Film Ekle" butonuna tıklayın
- Film bilgilerini doldurun (ad, yıl, tür, açıklama)
- "Kaydet" ile ekleyin

### 3. Öneri Alma
- "Film Önerileri" sayfasına gidin
- "İzlediklerime göre öner" seçeneğini işaretleyin/işareti kaldırın
  - ✅ İşaretli: İzlediklerinize benzer filmler önerilir
  - ❌ İşaretsiz: Genel popüler filmler önerilir
- "Film Önerilerini Getir" butonuna tıklayın
- AI tarafından hazırlanan önerileri görün

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Movies
- `GET /api/movies` - Kullanıcının filmlerini getir
- `POST /api/movies` - Yeni film ekle
- `DELETE /api/movies/[id]` - Film sil

### Recommendations
- `POST /api/recommendations` - AI önerileri al

## 🎨 Kullanılan Teknolojiler

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcryptjs
- **AI**: Google Gemini API
- **Icons**: Lucide React

## 🛡️ Güvenlik

- Şifreler bcrypt ile hash'lenir
- JWT token'ları httpOnly cookie'lerde saklanır
- API route'ları kimlik doğrulama ile korunur
- MongoDB injection'a karşı Mongoose kullanılır

## 📝 Notlar

- Gemini API anahtarı için: https://makersuite.google.com/app/apikey
- MongoDB cloud için: https://www.mongodb.com/cloud/atlas
- İlk kullanımda mutlaka `.env.local` dosyasını düzenleyin
- Production'da `JWT_SECRET` değerini değiştirin

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

## 🎉 Teşekkürler

Film önerileri için Google Gemini AI'a teşekkürler! 🚀
