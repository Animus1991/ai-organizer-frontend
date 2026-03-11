import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Enable demo mode by default so the app is accessible without a backend
if (!localStorage.getItem("demo_mode")) {
  localStorage.setItem("demo_mode", "true");
}

// Bootstrap app
createRoot(document.getElementById("root")!).render(<App />);
