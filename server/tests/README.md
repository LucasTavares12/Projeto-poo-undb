# Testes do servidor (caixa branca)

Testes unitários das classes de domínio do servidor (`server/src/module`).
São testes de **caixa branca**: foram escritos lendo o código, para que cada
caminho possível de cada método (cada `if`/`else`, laço, `return` antecipado
e curto-circuito de `&&`/`||`) seja executado por pelo menos um teste.

## Como rodar

Dentro da pasta `server/`:

```bash
npm install            # só na primeira vez
npm test               # roda todos os testes
npm run test:coverage  # roda os testes e mostra a cobertura de código
```

Não é preciso banco de dados nem servidor rodando: os testes usam apenas as
classes de domínio, em memória.

## Ferramentas

- [`node:test`](https://nodejs.org/api/test.html): executor de testes que já vem com o Node.js (versão 20 ou mais nova).
- [`tsx`](https://github.com/privatenumber/tsx): permite rodar os arquivos `.ts` direto, sem compilar antes (já era dependência do projeto).
- `node:assert/strict`: verificações dos resultados.

Nenhuma biblioteca nova foi adicionada ao projeto.

## O que é testado

| Arquivo | Classe(s) | Principais caminhos |
|---|---|---|
| `Agendamento.test.ts` | `Agendamento` | passagem de status (Agendado → Em atendimento → Finalizado), remarcar, mensagens de WhatsApp, arquivar/desarquivar, `moverPara`, `toJSON` |
| `Tratamento.test.ts` | `Tratamento` | valor (negativo, `NaN`, zero), duração múltipla de 30 min, nome (vazio, 150 e 151 caracteres), vínculo com profissional |
| `BloqueioAgenda.test.ts` | `BloqueioAgenda` | datas inválidas, fim antes do início, limite de 366 dias, profissional × clínica inteira, primeiro/último dia |
| `DataAgenda.test.ts` | `DataAgenda`, `AntecedenciaMinima` | leitura de `YYYY-MM-DD`, mesmo dia, antecedência mínima de 2h (exatamente 2h, 2h − 1 ms) |
| `Horario.test.ts` | `Horario` | formato `HH:MM`, grade de 30 min, soma de horários passando da meia-noite |
| `Telefone.test.ts` | `Telefone` | 10 e 11 dígitos, máscara, formatação de fixo e celular |
| `RelatorioMensal.test.ts` | `RelatorioMensal` | só finalizados do mês e do profissional, último dia do mês (bissexto), ticket médio sem atendimentos, faturamento por dia, ordenação e desempates |
| `HistoricoCliente.test.ts` | `HistoricoCliente` | agrupar pelo telefone, ordem dos agendamentos, busca sem acento e por 3+ dígitos, próximo agendamento, resumo e ficha |
| `AgendaSemanal.test.ts` | `AgendaSemanal` | período de 1 a 31 dias, linhas da grade, blocos livre/passado/fechado/agendamento, agendamento sobreposto |
| `Notificacao.test.ts` | `Notificacao` | textos para cliente e equipe, lista de serviços ("A, B e C"), cancelado sem vínculo, quem vê cada aviso |
| `Administrador.test.ts` | `Administrador` | e-mail, senha mínima de 6, hash com salt, conferência de senha (certa, errada, hash inválido), vínculo com profissional, JSON sem hash |
| `PerfilEConfiguracoes.test.ts` | `PerfilDeAcesso`, `ConfiguracoesClinica` | acesso total × conta de profissional, `exigir` (403), opções liga/desliga só com boolean |
| `Pessoa.test.ts` | `Pessoa`, `Cliente`, `Profissional` | nome (vazio, 150/151), telefone, `temTelefone`, fábricas `novo()`, especialidade (100/101), `atualizarDados`, polimorfismo de `apresentar()` |
| `RelogioClinica.test.ts` | `RelogioClinica` | fuso da clínica, deslocamento UTC (-03:00, +00:00, +05:30), hoje, momento, horário que já passou (com relógio controlado) |
| `Erros.test.ts` | hierarquia de erros | status HTTP de cada erro, `name` da classe concreta |

No início de cada arquivo há a lista dos caminhos testados, numerados
(`[C1]`, `[C2]`, …). Cada teste traz o número do caminho que cobre.

## Resultado atual

- **213 testes**, todos passando.
- Todas as classes de `src/module` e `src/erros` têm teste.
- Cobertura: cerca de **99% das linhas**, **96% dos desvios** e **99% das funções**.

## Observações encontradas nos testes

1. `Tratamento.atualizarDados()` valida e altera os campos um por um. Se um campo
   do meio for inválido (por exemplo, valor negativo), os campos anteriores (como
   o nome) já foram alterados quando o erro acontece. O teste `[C20]` de
   `Tratamento.test.ts` mostra esse comportamento.
2. `Profissional.atualizarDados()` tem o mesmo comportamento: com telefone
   inválido, o nome já foi trocado quando o erro acontece (`[C14]` de
   `Pessoa.test.ts`).
3. Na `AgendaSemanal`, se dois agendamentos se sobrepõem (um começa no meio do
   outro), só o primeiro aparece na agenda; o segundo fica escondido (`[C7]` de
   `AgendaSemanal.test.ts`). O serviço de agendamento não deixa isso acontecer,
   então só apareceria com dados gravados fora do sistema.

## Como escrever um novo teste

1. Crie um arquivo `NomeDaClasse.test.ts` nesta pasta.
2. Liste no início do arquivo os caminhos do método que você vai testar.
3. Escreva um `test(...)` para cada caminho:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Horario } from "../src/module/Horario";

test("[C1] horário fora da grade é inválido", () => {
  assert.equal(Horario.ehValido("09:15"), false);
});
```
