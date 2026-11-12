# Diagrama de Classes

Diagrama UML gerado a partir do código-fonte (`server/src` e `client/src`), com **todas as classes,
classes abstratas, interfaces e enumerações**, seus **atributos e métodos** (com visibilidade, tipos,
parâmetros e retorno) e os **relacionamentos** entre elas.

O diagrama existe em dois formatos:

- **`00-diagrama-de-classes-completo.png`**: imagem pronta para abrir, enviar ou colar em documentos.
- **`00-diagrama-de-classes-completo.svg`**: imagem vetorial. Abra no navegador e use o zoom sem perder qualidade.

Ele mostra o sistema inteiro (backend e frontend) em uma única imagem, com 171 elementos.

## Notação

| Símbolo | Significado |
|---|---|
| Linha cheia + triângulo vazado | Herança (`extends`) |
| Linha tracejada + triângulo vazado | Realização (`implements`) |
| Losango cheio na origem | Composição (a classe cria e guarda a instância, ex.: `new XRepository()`) |
| Linha cheia + seta | Associação (atributo do tipo da outra classe), com nome do papel e multiplicidade (`1`, `0..1`, `0..*`) |
| Linha tracejada cinza + seta | Dependência (usa a classe em parâmetros, retornos ou dentro dos métodos) |
| `+` / `-` / `#` | Público / privado / protegido |
| Sublinhado | Membro estático |
| Itálico | Classe ou método abstrato |
| `{readOnly}` | Atributo `readonly` |

Componentes React (páginas e componentes `.tsx`) e hooks são funções, não classes, por isso não aparecem no diagrama.
