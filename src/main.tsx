
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { ThemeProvider } from "./app/theme/ThemeContext";
  import { LanguageProvider } from "./app/i18n/LanguageContext";
  // @ts-ignore: CSS imports may not have type declarations in this setup
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  );
  