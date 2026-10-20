// No app não há rotas do Next: um link vira um <a> comum (a navegação entre abas é do próprio app).
import type { AnchorHTMLAttributes } from "react";

export default function Link({ href, ...resto }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...resto} />;
}
