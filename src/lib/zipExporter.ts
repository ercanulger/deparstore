import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function exportProjectZip() {
  const zip = new JSZip();

  // Root files
  zip.file('package.json', JSON.stringify({
    name: "deparstore-ecommerce",
    version: "1.0.0",
    private: true,
    scripts: {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview",
      "lint": "tsc --noEmit"
    },
    dependencies: {
      "firebase": "^10.12.0",
      "lucide-react": "^0.395.0",
      "motion": "^12.0.0",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "canvas-confetti": "^1.9.3",
      "jszip": "^3.10.1",
      "file-saver": "^2.0.5"
    },
    devDependencies: {
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "@types/canvas-confetti": "^1.9.0",
      "@types/file-saver": "^2.0.7",
      "@vitejs/plugin-react": "^4.3.0",
      "autoprefixer": "^10.4.19",
      "postcss": "^8.4.38",
      "tailwindcss": "^3.4.4",
      "typescript": "^5.4.5",
      "vite": "^5.2.11"
    }
  }, null, 2));

  zip.file('README.md', `# DeparStore - Profesyonel E-Ticaret ve Yönetici Paneli

Next.js / React, TypeScript, Tailwind CSS ve Firebase kullanılarak geliştirilmiş tam teşekküllü e-ticaret platformu.

## 🚀 Özellikler
- **Kullanıcı & Yönetici Girişi:** E-posta/Şifre ile müşteri ve yönetici girişi / yetkilendirme.
- **Yönetici Paneli (Admin):** Ürün ekleme, dinamik teknik özellik satırları, resim yükleme, envanter tablosu, sipariş durumu yönetimi.
- **Dinamik Vitrin & Arama:** Başlık, açıklama ve teknik özelliklere göre anlık arama, kategori ve fiyat filtreleri, indirim hesaplama.
- **Sepet & Ödeme (Checkout):** Kalıcı sepet, kupon kodları, 2 adımlı adres ve ödeme ekranı, sipariş yönetimi.

## 📦 Kurulum & Çalıştırma
1. Bağımlılıkları yükleyin:
\`\`\`bash
npm install
\`\`\`
2. Geliştirme sunucusunu başlatın:
\`\`\`bash
npm run dev
\`\`\`
3. Üretim sürümü (Production build):
\`\`\`bash
npm run build
\`\`\`

## 🌐 Vercel & GitHub Yayını
1. Bu projeyi GitHub'da yeni bir depoya yükleyin.
2. [Vercel](https://vercel.com) adresine gidin ve GitHub deponuzu bağlayın (Framework: Vite / React).
3. "Deploy" butonuna basın.
4. "Settings > Domains" sekmesinden kendi özel alan adınızı (Custom Domain) tek tıkla bağlayın.
`);

  zip.file('firebase-config.json', JSON.stringify({
    apiKey: "AIzaSyCMVOgdw8ScbtuJFhj_23LhpGbiTVAg7f0",
    authDomain: "store-4068d.firebaseapp.com",
    databaseURL: "https://store-4068d-default-rtdb.firebaseio.com",
    projectId: "store-4068d",
    storageBucket: "store-4068d.firebasestorage.app",
    messagingSenderId: "139400934366",
    appId: "1:139400934366:web:018dbfe7bc657ca8f8634f",
    measurementId: "G-Q942EJ9V6W"
  }, null, 2));

  zip.file('firestore.rules', `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email == 'retrokronik@gmail.com' ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
    }
    match /users/{userId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
      allow read, write: if isAdmin();
    }
    match /products/{productId} {
      allow read: if true;
      allow write: if true;
    }
    match /orders/{orderId} {
      allow read, write: if true;
    }
  }
}`);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'deparstore-full-project.zip');
}
