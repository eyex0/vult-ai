import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { loadSession } from "./lib/session";

void loadSession();

createRoot(document.getElementById("root")!).render(<App />);
