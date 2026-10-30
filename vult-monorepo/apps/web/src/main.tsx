import { createRoot } from "react-dom/client";
import App from "./App";
// Arabic glyphs only (unicode-range), loaded when Arabic text is on screen; Latin stays on Inter.
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "./index.css";
import { loadSession } from "./lib/session";

void loadSession();

createRoot(document.getElementById("root")!).render(<App />);
