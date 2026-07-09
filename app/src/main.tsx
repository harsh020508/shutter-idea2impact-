import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { TRPCProvider } from '@/providers/trpc'
import './index.css'
import App from './App.tsx'

if (localStorage.getItem("darkMode") === "true") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

const initLanguage = () => {
  const lang = localStorage.getItem("language") || "en";
  if (lang !== "en") {
    // Write cookie without domain so it works universally on localhost and production
    document.cookie = `googtrans=/en/${lang}; path=/; SameSite=Lax`;
    
    let translateDiv = document.getElementById("google_translate_element");
    if (!translateDiv) {
      translateDiv = document.createElement("div");
      translateDiv.id = "google_translate_element";
      translateDiv.style.display = "none";
      document.body.appendChild(translateDiv);
    }

    if (!document.getElementById("google-translate-script")) {
      // 1. First assign the callback on the window object
      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement({
          pageLanguage: 'en',
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'google_translate_element');
      };

      // 2. Then append the script to prevent race conditions during cache hits
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.type = "text/javascript";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    }
  } else {
    // Delete cookie on English selection
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
};
try {
  initLanguage();
} catch (e) {
  console.error("Language translation failed to initialize", e);
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <TRPCProvider>
      <App />
    </TRPCProvider>
  </BrowserRouter>
)
