import type { ReactNode } from "react";

interface Props {
  tamanho?: number;
}

function Icone({ tamanho = 18, children }: Props & { children: ReactNode }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconeCalendario(props: Props) {
  return (
    <Icone {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Icone>
  );
}

export function IconeRelogio(props: Props) {
  return (
    <Icone {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icone>
  );
}

export function IconeSetaDireita(props: Props) {
  return (
    <Icone {...props}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </Icone>
  );
}

export function IconeSetaEsquerda(props: Props) {
  return (
    <Icone {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </Icone>
  );
}

export function IconePessoas(props: Props) {
  return (
    <Icone {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Icone>
  );
}

export function IconeServico(props: Props) {
  return (
    <Icone {...props}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </Icone>
  );
}

export function IconeConfirmado(props: Props) {
  return (
    <Icone {...props}>
      <path d="M21.8 10A10 10 0 1 1 17 3.34" />
      <path d="m9 11 3 3L22 4" />
    </Icone>
  );
}

// Ícones do painel admin

export function IconeQuadro(props: Props) {
  return (
    <Icone {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18" />
    </Icone>
  );
}

export function IconeBrilho(props: Props) {
  return (
    <Icone {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" />
    </Icone>
  );
}

export function IconeEngrenagem(props: Props) {
  return (
    <Icone {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Icone>
  );
}

export function IconeSair(props: Props) {
  return (
    <Icone {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </Icone>
  );
}

export function IconeTelefone(props: Props) {
  return (
    <Icone {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
    </Icone>
  );
}

export function IconeAtualizar(props: Props) {
  return (
    <Icone {...props}>
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5M3 21v-5h5" />
    </Icone>
  );
}

export function IconeDinheiro(props: Props) {
  return (
    <Icone {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </Icone>
  );
}

export function IconeGrafico(props: Props) {
  return (
    <Icone {...props}>
      <path d="M3 3v18h18" />
      <path d="M8 17V11M13 17V7M18 17v-4" />
    </Icone>
  );
}

export function IconeTendencia(props: Props) {
  return (
    <Icone {...props}>
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </Icone>
  );
}

export function IconeMais(props: Props) {
  return (
    <Icone {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icone>
  );
}

export function IconeFechar(props: Props) {
  return (
    <Icone {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icone>
  );
}
