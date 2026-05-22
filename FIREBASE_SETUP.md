# Firebase Kurulum Rehberi — Finans

Bu rehber, Firebase Authentication, Firestore veri senkronu, App Check ve Android push bildirim altyapısını etkinleştirmek içindir.

## 1. Firebase Console

1. [Firebase Console](https://console.firebase.google.com/) → **Proje oluştur**
2. **Authentication** → Sign-in method → **E-posta/Parola** → Etkinleştir
3. **Firestore Database** → Veritabanı oluştur
4. **Project settings** → **Your apps** → Web uygulaması ekle (`</>` ikonu)
5. Yapılandırma nesnesindeki değerleri kopyalayın

## 2. Uygulama yapılandırması

```bash
cp src/config/firebase.config.example.ts src/config/firebase.config.ts
```

`src/config/firebase.config.ts` dosyasına Firebase Console değerlerinizi yapıştırın.

**Önemli:** Dosyada `export const firebaseConfig = { ... }` olmalıdır (`export` olmadan uygulama yalnızca yerel PIN ekranını gösterir).

## 3. Firestore güvenlik kuralları (Faz 3 — alt koleksiyonlar)

**Checklist (zorunlu):** Firebase Console → Firestore → Rules → aşağıdaki kuralları yapıştır → **Publish** düğmesine basın. Yayınlanmadan v2 senkron `permission-denied` verir.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /data/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /transactions/{txId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /reminders/{remId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /settings/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /meta/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

İlk girişte uygulama eski `users/{uid}/data/finance` belgesini otomatik olarak v2 alt koleksiyonlara taşır (`financeRepository.ts`).

### v2 veri yapısı

| Yol | İçerik |
|-----|--------|
| `users/{uid}/transactions/{id}` | Tek işlem |
| `users/{uid}/reminders/{id}` | Tek hatırlatıcı (notificationId bulutta yok) |
| `users/{uid}/settings/main` | Kategoriler, aylık bütçe, `updatedAt` |
| `users/{uid}/meta/schema` | `{ version: 2, migratedAt }` |

## 4. Firebase App Check

1. Console → **App Check** → uygulamanızı kaydedin
2. **Manage debug tokens** → geliştirme cihazınızın token'ını ekleyin (uygulama ilk çalıştırmada logda da görünebilir)
3. Proje kökünde `.env` oluşturun (`.env.example` dosyasını kopyalayın):

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN=Firebase-Console-debug-token-uuid
```

4. Expo'yu **yeniden başlatın** (env değişince zorunlu):

```bash
npx expo start --clear
```

- Geliştirmede yalnızca debug token yeterlidir; `src/config/appCheck.ts` debug modunda geçici reCAPTCHA ile App Check'i açar.
- Üretimde `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` tanımlayın; debug token kullanmayın.
- `.env` git'e eklenmez (`.gitignore`).

## 5. Push bildirimler (FCM) — Android

1. Paket adı: **`com.finans.android`**
2. `google-services.json` → proje kökü
3. `npx expo run:android` (Expo Go’da FCM sınırlı)

## 6. Çalıştırma

```bash
npm install
npx expo start
```

Native modüller (biyometrik kilit) için:

```bash
npx expo run:android
```

## 7. Faz 3 — ürün özellikleri

| Özellik | Konum |
|---------|--------|
| İşlem düzenleme | `app/transaction/edit.tsx`, Geçmiş / Ana sayfa |
| Bugün hatırlatıcıları | Ana sayfa + Takvim (bugün/gelecek) |
| Aylık bütçe & özet | Ana sayfa, `app/settings/budget.tsx` |
| Biyometrik kilit | `app/settings/security.tsx`, `AppLockGate` |
| App Check | `src/config/appCheck.ts` |
| Alt koleksiyon senkronu | `src/services/firebase/financeRepository.ts` |

## 8. İki cihaz + arka plan senkron testi

Aşağıdaki senaryoyu **kurallar Publish edildikten sonra** iki fiziksel cihaz veya emülatör + telefon ile doğrulayın.

| # | Adım | Beklenen |
|---|------|----------|
| 1 | Cihaz A: Firebase hesabıyla giriş, bir gider işlemi ekle | Banner kısa süre «Kaydediliyor…», sonra kaybolur |
| 2 | Firestore Console: `users/{uid}/transactions/{id}` | Yeni doküman görünür |
| 3 | Cihaz B: Aynı hesapla giriş (temiz kurulum veya mevcut) | İşlem geçmişte ve ana sayfada görünür |
| 4 | Cihaz A: İşlem ekledikten hemen arka plana al (debounce öncesi) | Firestore’da kayıt yine oluşur (`useSyncLifecycle` flush) |
| 5 | A ve B’de art arda düzenleme | Uzak veri daha yeniyse otomatik çekilir; «Diğer cihazdaki güncel veriler yüklendi» |
| 6 | Profil → Senkronizasyon → «Şimdi senkronize et» | `lastSyncAt` güncellenir, hata yok |
| 7 | 500+ işlem (isteğe bağlı import) | Geçmiş listesi akıcı kayar; banner sürekli açık kalmaz |

**Arka plan flush:** `src/hooks/useSyncLifecycle.ts` — uygulama `background` / `inactive` olunca bekleyen delta ve tam snapshot yüklenir.

**Delta yazım:** Her işlem/hatırlatıcı değişikliği tek Firestore dokümanı olarak gider (`financeRepository` `upsert*` / `delete*`).

## 9. Mimari özet

| Özellik | Dosya |
|---------|--------|
| Firebase init | `src/config/firebase.ts` |
| Auth | `src/services/firebase/auth.ts` |
| Firestore (v2 + migrasyon + delta) | `src/services/firebase/financeRepository.ts` |
| Delta / flush motoru | `src/services/sync/cloudSync.ts` |
| Legacy tek belge | `src/services/firebase/userData.ts` |
| Senkron dinleyici | `src/hooks/useFirebaseSync.ts` |
| Arka plan flush | `src/hooks/useSyncLifecycle.ts` |
| Performans ayarları | `src/store/useAppSettingsStore.ts` |
| Yerel depo | `src/store/financeStorage.ts` |
