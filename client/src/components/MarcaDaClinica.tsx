import { IconeCalendario } from "./Icones";

interface Props {
  /** Logo enviada na Personalização (data URL); null = ícone padrão. */
  logo: string | null | undefined;
  tamanho?: number;
  className?: string;
}

/** Logo da clínica, ou o ícone de calendário quando nenhuma imagem foi enviada. */
export function LogoDaClinica({ logo, tamanho = 20, className = "admin-marca-logo" }: Props) {
  if (logo) {
    return (
      <span className={`${className} com-imagem`}>
        <img src={logo} alt="" />
      </span>
    );
  }
  return (
    <span className={className}>
      <IconeCalendario tamanho={tamanho} />
    </span>
  );
}
