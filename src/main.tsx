import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root was not found.");
}

// 이번 로드는 성공했으니, 다음에 또 청크 로드 에러가 나면 다시 자동 새로고침할 수 있게 플래그를 지운다.
sessionStorage.removeItem("mimo_chunk_reload_once");

createRoot(container).render(<App />);
