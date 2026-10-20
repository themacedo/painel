// A ponte entre a tela e o processo principal: só estas quatro funções, nada de Node na tela.
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("fin", {
  carregar: () => ipcRenderer.invoke("painel:carregar"),
  entrar: () => ipcRenderer.invoke("auth:entrar"),
  sair: () => ipcRenderer.invoke("auth:sair"),
  aoAtualizar: (cb: (r: unknown) => void) => {
    const f = (_: unknown, r: unknown) => cb(r);
    ipcRenderer.on("painel:atualizado", f);
    return () => ipcRenderer.removeListener("painel:atualizado", f);
  },
});
