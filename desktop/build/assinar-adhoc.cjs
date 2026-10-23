// Assinatura ad-hoc do Painel.app depois do empacotamento. Sem nenhuma assinatura, o macOS não registra o app na
// Central de Notificações e descarta as notificações sem erro. A ad-hoc basta para isso (não há conta de dev da Apple).
const { execFileSync } = require("node:child_process");
const { join } = require("node:path");

exports.default = async function (ctx) {
  if (ctx.electronPlatformName !== "darwin") return;
  const app = join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.app`);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", app], { stdio: "inherit" });
};
