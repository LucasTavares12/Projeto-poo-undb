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
