// A ponte entre a tela e o processo principal: só estas funções, nada de Node na tela.
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("fin", {
  carregar: (forcar?: boolean) => ipcRenderer.invoke("painel:carregar", forcar),
  entrar: () => ipcRenderer.invoke("auth:entrar"),
  sair: () => ipcRenderer.invoke("auth:sair"),
  pendentes: () => ipcRenderer.invoke("revisar:pendentes"),
  revisar: (revisoes: unknown[]) => ipcRenderer.invoke("revisar:enviar", revisoes),
  avisos: () => ipcRenderer.invoke("avisos:indice"),
  aviso: (id: string) => ipcRenderer.invoke("avisos:ler", id),
  aoIrPara: (cb: (aba: string) => void) => {
    const f = (_: unknown, aba: string) => cb(aba);
    ipcRenderer.on("ir:aba", f);
    return () => ipcRenderer.removeListener("ir:aba", f);
  },
  aoAtualizar: (cb: (r: unknown) => void) => {
    const f = (_: unknown, r: unknown) => cb(r);
    ipcRenderer.on("painel:atualizado", f);
    return () => ipcRenderer.removeListener("painel:atualizado", f);
  },
});
