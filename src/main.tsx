
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import './i18n/index';
import './styles/index.css';      // 이 안에서 theme.css를 @import 함
  createRoot(document.getElementById("root")!).render(<App />);
  