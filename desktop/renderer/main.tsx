import { createRoot } from "react-dom/client";
// as mesmas fontes do site, empacotadas (a tela não acessa a internet)
import "@fontsource/inter-tight/400.css";
import "@fontsource/inter-tight/500.css";
import "@fontsource/inter-tight/600.css";
import "@fontsource/inter-tight/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./estilo.css";
import { App } from "./App";

createRoot(document.getElementById("raiz")!).render(<App />);
