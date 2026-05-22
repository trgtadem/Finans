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

## 8. Çevrimdışı öncelikli model

| Durum | Ağ | Davranış |
|-------|-----|----------|
| Uygulama açılışı (oturum hatırlanıyor) | Gerekmez | `finance-storage-{uid}` önbelleğinden anında UI |
| E-posta ile giriş | Bir kez | Önce bekleyen yedek varsa yükle, sonra `fetchUserFinanceOnce` → önbellek |
| Oturum içi düzenleme | Gerekmez | Yalnızca yerel + `hasPendingCloudSync` |
| Arka plan / kapanma | Varsa | `saveUserFinance` tam snapshot |
| Manuel | İsteğe bağlı | Profil → Senkronizasyon: Buluta yükle / Buluttan indir |

**Çok cihaz:** Anlık senkron yok. Cihaz B, A yedekledikten ve B tekrar giriş yaptıktan sonra güncel veriyi görür.

**Uygulama silme:** Yerel önbellek silinir. Yeniden kurulum + giriş → veriler Firestore’dan bir kez indirilir.

## 9. Test checklist

| # | Adım | Beklenen |
|---|------|----------|
| 1 | Giriş → işlem ekle → uçak modu | İşlem listede kalır |
| 2 | Arka plana al (online) | Firestore’da snapshot güncellenir |
| 3 | Soğuk açılış (oturum var, uçak modu) | Veriler önbellekten gelir, bekleme yok |
| 4 | Çıkış → giriş (online) | Buluttan tek indirme |
| 5 | Senkronizasyon → Buluta yükle / Buluttan indir | Manuel yedek çalışır |

## 10. Mimari özet

| Özellik | Dosya |
|---------|--------|
| Firebase init | `src/config/firebase.ts` |
| Auth + girişte pull bayrağı | `src/store/useAuthStore.ts` (`cloudPullRequested`) |
| Firestore okuma/yazma | `src/services/firebase/financeRepository.ts` |
| Yedek motoru (pull/push) | `src/services/sync/cloudSync.ts` |
| Oturum / önbellek | `src/store/financeSession.ts`, `financeStorage.ts` |
| Giriş pull + oturum | `src/hooks/useFirebaseSync.ts` |
| Kapanışta yükleme | `src/hooks/useSyncLifecycle.ts` |
| Yerel state | `src/store/useFinanceStore.ts` (persist v5, `hasPendingCloudSync`) |
