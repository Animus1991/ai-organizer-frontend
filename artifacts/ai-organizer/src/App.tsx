// src/App.tsx — Entry point: wraps the real app with BrowserRouter + AuthProvider
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import PagesApp from "./pages/App";

const basename = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const App = () => (
  <BrowserRouter basename={basename}>
    <AuthProvider>
      <PagesApp />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
