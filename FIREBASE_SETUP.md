# Firebase Kurulum Rehberi — Finans

Bu rehber, Firebase Authentication, Firestore veri senkronu ve Android push bildirim altyapısını etkinleştirmek içindir.

## 1. Firebase Console

1. [Firebase Console](https://console.firebase.google.com/) → **Proje oluştur**
2. **Authentication** → Sign-in method → **E-posta/Parola** → Etkinleştir
3. **Firestore Database** → Veritabanı oluştur (test modunda başlayabilirsiniz; kuralları aşağıda sıkılaştırın)
4. **Project settings** → **Your apps** → Web uygulaması ekle (`</>` ikonu)
5. Yapılandırma nesnesindeki değerleri kopyalayın

## 2. Uygulama yapılandırması

```bash
cp src/config/firebase.config.example.ts src/config/firebase.config.ts
```

`src/config/firebase.config.ts` dosyasına Firebase Console değerlerinizi yapıştırın.

Dosya `.gitignore` içindedir; gerçek anahtarları commit etmeyin.

## 3. Firestore güvenlik kuralları (önerilen)

Kullanıcı verileri `users/{userId}/data/finance` dokümanında tutulur (işlemler, hatırlatıcılar, kategoriler).

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /data/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 4. Push bildirimler (FCM) — yalnızca Android

Yerel hatırlatıcı bildirimleri `expo-notifications` ile cihazda planlanır (internet gerekmez).

**Uzak push (FCM)** için:

1. Firebase Console → Android uygulaması paket adı: **`com.finans.android`**
2. `google-services.json` indirin → proje köküne koyun (`app.json` ile aynı paket adı olmalı)
3. `npx expo run:android` veya EAS Build ile native build alın (Expo Go’da FCM sınırlıdır)

Giriş yapan kullanıcının push token’ı `users/{uid}` dokümanına yazılır (`pushToken` alanı).

## 5. Çalıştırma

```bash
npm install
npx expo start
```

- `firebase.config.ts` **doluysa**: e-posta + 6 haneli şifre, Firestore senkronu
- Her kullanıcının verisi ayrı Firestore dokümanında ve cihazda `finance-storage-{uid}` anahtarıyla saklanır

## 6. Mimari özet

| Özellik | Dosya |
|---------|--------|
| Firebase init | `src/config/firebase.ts` |
| Auth | `src/services/firebase/auth.ts` |
| Kullanıcı finans verisi | `src/services/firebase/userData.ts` |
| Kullanıcıya özel yerel depo | `src/store/financeStorage.ts` |
| Push token | `src/services/firebase/push.ts` |
| Senkron hook | `src/hooks/useFirebaseSync.ts` |
