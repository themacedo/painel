import type { MetadataRoute } from "next";

// Instalar na tela inicial do celular (PWA): abre em tela cheia, como um app. Sem service worker de propósito:
// nada dos dados fica guardado no aparelho para uso offline.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Painel pessoal",
    short_name: "Painel",
    description: "Finanças e desempenho como dev num lugar só.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "pt-BR",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
