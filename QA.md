# Garantia de Qualidade (QA) — Sistema de Agendamento para Clínica de Estética

**Responsável:** Antonio Alexandre (QA)
**Branch de trabalho:** `QA`
**Versão analisada:** commit `c628f70` da `main` (outubro de 2026)

Este documento reúne o trabalho de qualidade do projeto: o que é testado, como é testado, os casos de teste do **back-end** e do **front-end** e os defeitos encontrados até agora.

---

## 1. Objetivo

Garantir que o sistema faça o que promete: o cliente consegue agendar sem conflito de horário, o administrador consegue acompanhar os atendimentos no Kanban e os relatórios mostram números corretos.

Também verificamos se o código respeita os princípios de POO cobrados na disciplina, principalmente o **encapsulamento**: um objeto não deve deixar que alguém de fora coloque seus dados num estado inválido.

---

## 2. Escopo

| Parte | O que é testado |
|---|---|
| **Back-end** (`server/`) | Modelos de domínio (`Horario`, `Agendamento`, `Tratamento`...), regras de negócio nos *services*, rotas da API e permissões de acesso |
| **Front-end** (`client/`) | Telas do cliente e do painel admin, validações de formulário, navegação e mensagens de erro |
| **Integração** | Front + API + MySQL funcionando juntos nos fluxos completos |

**Fora do escopo por enquanto:** testes de carga/desempenho e testes de segurança aprofundados.

---

## 3. Estratégia de testes

Os testes são organizados em camadas, das mais rápidas e baratas para as mais completas:

```
        ▲   Testes manuais de ponta a ponta (navegador)    ← poucos, cobrem o fluxo inteiro
       ▲▲▲  Testes da API (requisições HTTP)               ← regras de negócio + permissões
     ▲▲▲▲▲▲ Testes unitários dos modelos (Vitest)          ← muitos, rápidos, sem banco
```

1. **Testes unitários (planejado):** usar o **Vitest** para testar as classes de domínio isoladamente, sem banco de dados. Começar por `Horario`, `Agendamento` e `Tratamento` no back, e pelos modelos do front (`Dinheiro`, `Telefone`, `Duracao`, `DataAgenda`).
2. **Testes da API:** chamar as rotas diretamente (navegador, Postman/Insomnia ou `curl`) e conferir respostas, códigos HTTP e bloqueios de acesso.
3. **Testes manuais de ponta a ponta:** executar os fluxos reais no navegador, como um usuário faria.
4. **Integração contínua:** o CI criado pelo DevOps (GitHub Actions) hoje só confere se o código **instala e compila**. Quando os testes Vitest existirem, a proposta é incluir um passo `npm test` nos workflows, para que todo Pull Request rode os testes automaticamente.

---

## 4. Ambiente de teste

| Item | Configuração |
|---|---|
| Sistema operacional | Windows 11 |
| Banco de dados | MySQL Server 9.7 local, banco `projetopoo` |
| Back-end | Node + TypeScript + Express — `cd server && npm run dev` → http://localhost:3000 |
| Front-end | React + Vite — `cd client && npm run dev` → http://localhost:5173 |
| Navegador | Google Chrome |
| Verificação rápida | http://localhost:3000/health/db deve responder `{"status":"ok","database":"conectado"}` |

---

## 5. Casos de teste — Back-end

**Legenda de status:** ✅ Passou · ❌ Falhou (defeito registrado) · ⬜ A executar

### 5.1 Modelos de domínio (unitários)

| ID | Caso de teste | Resultado esperado | Status |
|---|---|---|---|
| BE-01 | Criar `Horario("09:00")` e `Horario("09:30")` | Aceita | ⬜ |
| BE-02 | Criar `Horario("09:15")` (fora da grade de 30 min) | Erro | ⬜ |
| BE-03 | Criar `Horario("09:90")` (minuto inexistente) | Erro | ❌ [BUG-01](#bug-01--horario-aceita-horas-e-minutos-inexistentes) |
| BE-04 | Criar `Horario("25:00")` (hora inexistente) | Erro | ❌ [BUG-01](#bug-01--horario-aceita-horas-e-minutos-inexistentes) |
| BE-05 | `Horario("23:30").somarSlots(1)` | Erro (passa da meia-noite) | ❌ [BUG-02](#bug-02--somarslots-dá-a-volta-na-meia-noite) |
| BE-06 | Criar `Tratamento` com valor negativo | Erro | ⬜ |
| BE-07 | Criar `Tratamento` com duração de 45 min | Erro (não é múltiplo de 30) | ⬜ |
| BE-08 | Criar `Agendamento` sem tratamentos | Erro | ⬜ |
| BE-09 | `getValorTotal()` e `getDuracaoTotalMinutos()` com 2 tratamentos | Soma correta | ⬜ |
| BE-10 | `getHorariosOcupados()` com 2 tratamentos de 30 min às 09:00 | `["09:00", "09:30"]` | ⬜ |
| BE-11 | `avancarStatus()`: AGENDADO → EM_ATENDIMENTO → FINALIZADO | Avança uma etapa por vez | ⬜ |
| BE-12 | `moverPara(AGENDADO)` num agendamento FINALIZADO | Erro (transição inválida) | ❌ [BUG-03](#bug-03--kanban-permite-voltar-um-atendimento-finalizado) |
| BE-13 | `arquivar()` num agendamento que não está FINALIZADO | Erro | ⬜ |
| BE-14 | Alterar a data recebida de `getData()` | Agendamento não muda | ❌ [BUG-04](#bug-04--getters-expõem-dados-internos-quebra-de-encapsulamento) |
| BE-15 | Esvaziar a lista recebida de `getTratamentos()` | Agendamento não muda | ❌ [BUG-04](#bug-04--getters-expõem-dados-internos-quebra-de-encapsulamento) |

### 5.2 Regras de negócio e API

| ID | Caso de teste | Resultado esperado | Status |
|---|---|---|---|
| BE-20 | `POST /agendamentos` num horário livre e liberado | Agendamento criado | ⬜ |
| BE-21 | `POST /agendamentos` num horário já ocupado | Erro "Esse horário não está mais disponível" | ⬜ |
| BE-22 | Agendar tratamento de 60 min em que o 2º slot já está ocupado | Erro (não cabe) | ⬜ |
| BE-23 | Agendar tratamento de um profissional com outro profissional | Erro "não é realizado por..." | ⬜ |
| BE-24 | Telefone com 9 dígitos (sem DDD) | Erro "Telefone inválido" | ⬜ |
| BE-25 | `POST /agendamentos` com data no passado | Erro | ⬜ (suspeita: [BUG-05](#bug-05--a-api-não-bloqueia-agendamento-no-passado-a-confirmar)) |
| BE-26 | Cliente cancela (`DELETE /meus-agendamentos/:id`) informando outro telefone | Erro "não encontrado" | ⬜ |
| BE-27 | Cancelar agendamento EM_ATENDIMENTO | Erro | ⬜ |
| BE-28 | Depois de cancelar, o horário volta a aparecer em `/disponibilidade` | Horário livre | ⬜ |
| BE-29 | Agendamento com data de 2+ dias atrás em AGENDADO | Vira FINALIZADO sozinho ao abrir o Kanban | ⬜ |
| BE-30 | `GET /agendamentos` sem token | 401 | ⬜ |
| BE-31 | Usuário vinculado a um profissional tenta ver/mover agendamento de outro profissional | "Agendamento não encontrado" | ⬜ |
| BE-32 | Usuário sem acesso total chama `POST /profissionais` ou `/usuarios` | Bloqueado | ⬜ |
| BE-33 | `POST /cadastro` com cadastro público desativado nas configurações | 403 | ⬜ |
| BE-34 | `POST /cadastro` com e-mail já existente | 409 | ⬜ |
| BE-35 | `POST /login` com senha errada | 401 com mensagem genérica | ⬜ |
| BE-36 | `GET /relatorios/mensal` confere com os agendamentos do mês (inclusive arquivados) | Totais corretos | ⬜ |

---

## 6. Casos de teste — Front-end

| ID | Tela | Caso de teste | Resultado esperado | Status |
|---|---|---|---|---|
| FE-01 | `/admin/cadastro` | Criar conta com e-mail e senha válidos | Conta criada, redireciona | ⬜ |
| FE-02 | `/admin/login` | Login com senha errada | Mensagem de erro, sem entrar | ⬜ |
| FE-03 | `/admin` | Acessar o painel sem estar logado | Redireciona para o login | ⬜ |
| FE-04 | `/admin/profissionais` | Cadastrar, editar e excluir profissional | Lista atualiza | ⬜ |
| FE-05 | `/admin/tratamentos` | Cadastrar tratamento com valor e duração | Valor em R$ e duração exibidos corretamente | ⬜ |
| FE-06 | `/admin/tratamentos` | Tentar valor negativo ou duração inválida | Mensagem de erro clara | ⬜ |
| FE-07 | `/admin/horarios` | Liberar horários de um profissional na semana | Horários aparecem na grade | ⬜ |
| FE-08 | `/` (cliente) | Escolher profissional, tratamento, data e horário e agendar | Confirmação de agendamento | ⬜ |
| FE-09 | `/` (cliente) | Seletor de data não deixa escolher dia passado | Dias anteriores a hoje bloqueados | ⬜ |
| FE-10 | `/` (cliente) | Horário recém-agendado some da lista para o próximo cliente | Horário indisponível | ⬜ |
| FE-11 | `/` (cliente) | Dois navegadores escolhem o mesmo horário ao mesmo tempo | Só um consegue; o outro vê erro | ⬜ |
| FE-12 | `/` (cliente) | Telefone incompleto | Mensagem de erro | ⬜ |
| FE-13 | `/` (cliente) | Buscar "meus agendamentos" pelo telefone e cancelar | Agendamento cancelado, horário liberado | ⬜ |
| FE-14 | `/admin` (Kanban) | Arrastar card AGENDADO → EM_ATENDIMENTO → FINALIZADO | Card muda de coluna e o status persiste ao recarregar | ⬜ |
| FE-15 | `/admin` (Kanban) | Arrastar card FINALIZADO de volta para AGENDADO | Bloqueado | ⬜ (ver [BUG-03](#bug-03--kanban-permite-voltar-um-atendimento-finalizado)) |
| FE-16 | `/admin` (Kanban) | Cancelar agendamento com confirmação | Card some | ⬜ |
| FE-17 | `/admin` (Kanban) | "Limpar" finalizados e depois "Mostrar ocultos" | Cards saem e voltam | ⬜ |
| FE-18 | `/admin/relatorios` | Relatório do mês | Totais batem com o Kanban | ⬜ |
| FE-19 | `/admin/configuracoes` | Desativar cadastro público e tentar `/admin/cadastro` | Cadastro bloqueado | ⬜ |
| FE-20 | Geral | Usar as telas no celular (largura ~375px) | Layout utilizável, sem rolagem lateral | ⬜ |

---

## 7. Defeitos encontrados

Os defeitos abaixo foram **confirmados executando o código** dos modelos (script com `tsx`), exceto quando indicado "a confirmar".

### BUG-01 — `Horario` aceita horas e minutos inexistentes
- **Onde:** `server/src/module/Horario.ts` → `ehValido()`
- **Severidade:** Média
- **Como reproduzir:** `Horario.ehValido("09:90")` e `Horario.ehValido("25:00")` retornam `true`, e `new Horario("99:30")` é criado sem erro.
- **Causa:** o método só confere o formato `HH:MM` e se o total de minutos é múltiplo de 30. Não confere se a hora está entre 00 e 23 nem se o minuto está entre 00 e 59.
- **Sugestão:** validar também `horas <= 23` e `minutos <= 59`.

### BUG-02 — `somarSlots` dá a volta na meia-noite
- **Onde:** `server/src/module/Horario.ts` → `minutosParaTexto()` (uso de `% 24`)
- **Severidade:** Baixa (hoje a clínica não atende de madrugada), mas pode esconder erros de cálculo
- **Como reproduzir:** `new Horario("23:30").somarSlots(1)` retorna `"00:00"`, como se o atendimento continuasse no mesmo dia.
- **Sugestão:** lançar erro quando o resultado passar de 23:59.

### BUG-03 — Kanban permite voltar um atendimento finalizado
- **Onde:** `server/src/module/Agendamento.ts` → `moverPara()`
- **Severidade:** Média
- **Como reproduzir:** num agendamento FINALIZADO, `moverPara(StatusAgendamento.AGENDADO)` é aceito e o status volta para AGENDADO.
- **Impacto:** um atendimento já realizado pode "reabrir" e voltar a ser cancelável, o que afeta os relatórios.
- **Sugestão:** definir quais transições são permitidas (por exemplo, só para a etapa vizinha e nunca saindo de FINALIZADO).

### BUG-04 — Getters expõem dados internos (quebra de encapsulamento)
- **Onde:** `server/src/module/Agendamento.ts` → `getData()` e `getTratamentos()`
- **Severidade:** Média (é um ponto avaliado em POO)
- **Como reproduzir:**
  - `agendamento.getData().setFullYear(1999)` muda a data **dentro** do agendamento;
  - `agendamento.getTratamentos().length = 0` deixa o agendamento **sem tratamentos** e com valor total `0`, mesmo com o construtor proibindo isso.
- **Sugestão:** devolver cópias: `new Date(this.data)` e `[...this.tratamentos]`.

### BUG-05 — A API não bloqueia agendamento no passado *(a confirmar)*
- **Onde:** `server/src/services/AgendamentoService.ts` → `criar()`
- **Severidade:** Média
- **Observação:** o front bloqueia datas passadas no seletor (`min` = hoje), mas o back não faz essa verificação. Uma chamada direta à API com uma data passada provavelmente seria aceita. Também não há bloqueio para um horário de **hoje** que já passou.
- **Sugestão:** validar a data e a hora no back-end também, porque a regra do servidor é a que vale.

### Observações de documentação
- O `README.md` (seção 4) diz que *"um tratamento pode ser realizado por diferentes profissionais"*. No código, cada `Tratamento` tem **um** `profissionalId`, ou nenhum (aí qualquer profissional pode realizar). Ou seja, não é possível escolher 2 ou 3 profissionais específicos.
- O `README.md` diz que o agendamento tem *"um tratamento"*, mas o sistema permite **vários tratamentos** no mesmo agendamento.

### Riscos observados
- **Agendamento simultâneo:** a verificação de disponibilidade e a gravação são feitas em passos separados, sem trava no banco. Dois clientes que confirmam o mesmo horário quase ao mesmo tempo podem conseguir os dois agendamentos. O caso FE-11 testa isso.
- **Docker do server sem banco:** o `Dockerfile` do server (criado pelo DevOps e já incorporado à `main`) sobe só a API. Sem um MySQL acessível, ela não conecta. Sugestão para o DevOps: um `docker-compose` com API + MySQL.

---

## 8. Próximos passos

- [ ] Executar os casos marcados com ⬜ e atualizar o status deste documento
- [ ] Confirmar o BUG-05 com uma chamada direta à API
- [ ] Adicionar o **Vitest** ao `server/` e transformar os casos BE-01 a BE-15 em testes automatizados
- [ ] Adicionar testes dos modelos do front (`Dinheiro`, `Telefone`, `Duracao`, `DataAgenda`)
- [ ] Combinar com o DevOps a inclusão de `npm test` nos workflows do CI
- [ ] Repassar os bugs para o time de desenvolvimento e testar novamente após as correções
