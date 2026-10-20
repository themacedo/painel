// Página pública exigida pelo Google para publicar o login (OAuth): o que o painel lê e guarda. Sem dado nenhum.
export const metadata = { title: "Privacidade · Painel" };

export default function Privacidade() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed">
      <h1 className="mb-4 text-xl font-semibold">Política de privacidade</h1>
      <p className="mb-3">Este painel é de uso pessoal de um único usuário: o dono. Não há cadastro aberto e nenhum outro e-mail consegue entrar.</p>
      <h2 className="mb-1 mt-5 font-semibold">O que o login com Google lê</h2>
      <p className="mb-3">Só o nome, a foto e o endereço de e-mail da conta Google, para conferir se quem entra é o dono. Nada é lido do Gmail, do Drive nem de outro serviço do Google.</p>
      <h2 className="mb-1 mt-5 font-semibold">O que fica guardado</h2>
      <p className="mb-3">Um cookie de sessão no navegador (ou um token no cofre do sistema, no app de computador), para não pedir login a cada acesso. Os dados financeiros exibidos pertencem ao próprio dono, ficam em armazenamento privado e não são compartilhados com terceiros nem usados para publicidade.</p>
      <h2 className="mb-1 mt-5 font-semibold">Como revogar</h2>
      <p className="mb-3">A qualquer momento em myaccount.google.com → Segurança → Apps de terceiros com acesso à conta. O botão Sair também encerra a sessão.</p>
      <p className="mt-8 text-xs text-texto-2">Atualizado em 20/10/2026.</p>
    </main>
  );
}
