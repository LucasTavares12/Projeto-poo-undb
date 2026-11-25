# Sistema de Agendamento para Clínica de Estética

Projeto acadêmico desenvolvido na disciplina de Programação Orientada a Objetos (PBL).

---

## 1. Projeto

### O que é o sistema

O Sistema de Agendamento para Clínica de Estética é uma plataforma que permite aos clientes realizarem seus próprios agendamentos pela internet e, ao mesmo tempo, oferece à clínica uma forma centralizada de acompanhar e organizar todos os atendimentos.

### Para quem foi criado

O sistema foi pensado para **clínicas de estética**, principalmente aquelas que ainda organizam seus horários, profissionais e atendimentos por meio de agendas de papel, mensagens ou outros métodos descentralizados.

### Qual problema procura resolver

Quando as informações de uma clínica ficam espalhadas em agendas e mensagens, aumentam as chances de:

- erros na marcação de horários;
- esquecimentos de atendimentos;
- conflitos de horários;
- desencontro de informações entre clientes, profissionais e a clínica.

### Objetivo principal

Facilitar e organizar o processo de agendamento de procedimentos. O cliente escolhe o profissional, o tratamento e um horário disponível, e a clínica passa a ter uma visão centralizada de todos os atendimentos, podendo acompanhar cada agendamento.

### Como funciona de maneira geral

**Para o cliente:**

1. Escolhe o profissional.
2. Escolhe um ou mais serviços (tratamentos) que aquele profissional realiza.
3. Escolhe a data e um dos horários livres daquele dia.
4. Diz se o atendimento é **para ele** ou **para outra pessoa** (ex.: a mãe marcando para a filha com o próprio telefone), informa os nomes, o telefone e a **forma de pagamento** que vai usar, confere o resumo e confirma o agendamento.
5. Se precisar, depois remarca ou cancela informando o telefone usado. Quem marcou para outras pessoas vê todos os agendamentos daquele telefone.

**Para a clínica (administrador):**

- Cadastra profissionais, tratamentos e os horários de atendimento de cada profissional.
- Fecha a agenda em folgas, férias e feriados.
- Acompanha os atendimentos em um quadro dividido por etapas: **Agendado**, **Em atendimento** e **Finalizado**.
- Vê a semana de cada profissional numa agenda, horário a horário.
- Consulta a ficha e o histórico de cada cliente.
- Manda lembretes e agradecimentos pelo WhatsApp.
- Acompanha o faturamento e o lucro nos relatórios (informando o gasto de cada mês).

---

## 2. Funcionalidades

### Área do cliente (página pública)

| Funcionalidade | Como funciona |
|---|---|
| **Agendar** | Passo a passo com barra de progresso: profissional → serviço(s) → data → horário → dados. Mostra o total (valor e duração) dos serviços escolhidos. |
| **Escolha da data** | Faixa com os próximos 14 dias para tocar e escolher. Dias de folga ou feriado aparecem riscados como "fechado". Para datas mais distantes, há um calendário. |
| **Horários disponíveis** | Só aparecem horários realmente livres: dentro da grade do profissional, sem outro agendamento e com espaço para a duração de todos os serviços. Ficam separados em Manhã, Tarde e Noite. |
| **Forma de pagamento** | Na etapa "Seus dados", o cliente escolhe como vai pagar: Pix, cartão de crédito, cartão de débito ou dinheiro (obrigatório). A clínica já fica sabendo e agiliza a hora do pagamento. |
| **Confirmação** | Antes de gravar, abre a janela "Está tudo certo?" com o resumo completo (data, profissional, serviços, valor, forma de pagamento, nome e telefone; e quem marcou, quando é para outra pessoa). |
| **Informações da clínica** | Na tela inicial, um cartão mostra se a clínica está **aberta ou fechada agora** ("Aberto agora · Fecha às 18:00" / "Fechado agora · Abre amanhã às 08:00"). A setinha abre os dias e horários da semana, com o dia de hoje em destaque. Abaixo vêm o endereço por extenso (abre o Google Maps) e botões de WhatsApp, Instagram e Localização. É só informativo: pelo site dá para agendar a qualquer hora. |
| **Ver horários** | Consulta os horários livres de um profissional sem precisar agendar. |
| **Meus agendamentos** | O cliente informa o telefone usado no agendamento e vê os agendamentos em aberto, inclusive os que marcou para outras pessoas com o próprio telefone (cada um diz para quem é, e dá para filtrar por pessoa). Pode **remarcar** (só para horários livres, com confirmação "De / Para") ou **cancelar**. O aviso que chega ao painel diz quem fez e de quem era o horário ("Maria cancelou o horário de Ana"). |
| **Antecedência mínima** | Pelo site, agendar, remarcar e cancelar só com pelo menos **2 horas** de antecedência. |

### Painel da clínica (área administrativa)

| Funcionalidade | Como funciona |
|---|---|
| **Agendamentos (quadro Kanban)** | Colunas Agendado, Em atendimento e Finalizado. Os cards são arrastados (ou movidos por botões) de uma etapa para outra. Cards agendados podem ser cancelados ou remarcados. Mostra resumo do dia: agendamentos de hoje, fila, em atendimento e faturado no dia. |
| **Finalizados somem sozinhos** | Atendimentos finalizados há 2 dias saem do quadro automaticamente e vão para "Mostrar ocultos". Continuam nos relatórios e no histórico. Também há o botão "Limpar". Agendamentos esquecidos são finalizados sozinhos 2 dias depois da data. |
| **Agenda** | A semana de um profissional horário a horário: atendimentos (com a cor da etapa e a duração), horários livres, horários que já passaram e dias fechados. Clicar num horário livre abre o "Novo agendamento" já preenchido. Clicar num atendimento abre o resumo, com atalhos para a ficha do cliente, WhatsApp e remarcar. No celular, mostra um dia por vez. |
| **Novo agendamento** | A equipe agenda pelo painel (ex: cliente que ligou ou chegou na hora), sem a regra de antecedência mínima. A forma de pagamento é opcional aqui e pode ser trocada depois no resumo do agendamento (ex.: o cliente mudou de ideia na hora de pagar). |
| **Faltas** | Cada card mostra a forma de pagamento. Depois que o horário começa, aparece o botão **"Não compareceu"**: o card vai para a coluna dos finalizados marcado como falta (dá para desfazer). Faltas não entram no faturamento e não são finalizadas sozinhas. O card avisa quando o cliente já faltou antes ("Faltou 2 vezes", em destaque a partir de 2). |
| **Lembretes e agradecimentos pelo WhatsApp** | Nos agendados, o botão "Enviar lembrete" abre o WhatsApp do cliente com a mensagem pronta (data, horário, serviços, profissional e forma de pagamento). Nos finalizados, o botão "Agradecer" abre uma mensagem de agradecimento. O card mostra quando cada mensagem foi enviada. |
| **Clientes** | Lista de todos os clientes, com busca por nome ou telefone. A ficha mostra atendimentos, faltas (com a taxa e um alerta para quem costuma faltar), total gasto, ticket médio, último atendimento, próximo horário, tratamentos mais feitos, profissionais que atenderam e o histórico completo em linha do tempo. Um mesmo telefone pode ter várias pessoas (ex.: mãe e filha): cada uma tem a sua ficha, e a ficha mostra quem marcou e as outras pessoas do telefone. |
| **Tratamentos** | Cadastro de procedimentos com descrição, valor, duração e o profissional que realiza (ou todos). |
| **Profissionais** | Cadastro de quem realiza os atendimentos. |
| **Horários** | Primeiro, o **funcionamento da clínica**: os dias da semana em que ela abre e o horário de cada dia (ex.: segunda a sexta das 08:00 às 18:00, sábado até 12:00, domingo fechado). Só os administradores alteram. Depois, a grade semanal de cada profissional: clica-se nos horários (de 30 em 30 minutos) para liberar ou bloquear, sempre dentro do funcionamento (dias fechados e horários fora ficam bloqueados). Os horários liberados se repetem toda semana. Um atendimento só é oferecido ao cliente se couber inteiro dentro do funcionamento. |
| **Folgas e feriados** | Fecha dias inteiros na agenda de um profissional (folga, férias, atestado) ou da clínica inteira (feriado). Nesses dias nenhum horário aparece livre. Se já houver agendamentos no período, o sistema avisa quais são. |
| **Relatórios** | Faturamento do mês (com comparação com o mês anterior), número de atendimentos e de faltas (com a taxa de faltas), ticket médio, melhor dia, gráfico de faturamento por dia, tratamentos mais realizados, faturamento por forma de pagamento e faturamento por profissional. Na parte **Lucro**, informa-se o gasto do mês e o sistema mostra o lucro (ou prejuízo) e a margem: com "Todos os profissionais", é o lucro da clínica (faturamento total − gasto da clínica); escolhendo um profissional, é o lucro dele (faturamento dele − gasto próprio dele). Cada profissional vê e informa só o próprio; quem tem acesso total vê e informa todos. O gasto pode ser editado ou apagado (se foi informado errado) e, se o mês ainda não tem gasto, o sistema sugere o valor do mês anterior. |
| **Configurações e usuários** | Liga ou desliga os botões "Entrar" e "Cadastrar" na página pública. Gerencia as contas do painel: criar usuário, trocar e-mail, redefinir senha, excluir, vincular a um profissional e marcar o profissional como administrador da clínica. |
| **Personalização** | Deixa o sistema com a cara da clínica: nome da clínica (barra lateral, página de agendamento, título da aba e mensagens de WhatsApp), logo no lugar do ícone (a imagem é reduzida no navegador antes de enviar), as cores principal e da barra lateral e os **contatos** (WhatsApp, Instagram, endereço e link do Google Maps, mostrados na página do cliente), com combinações prontas, prévia ao vivo antes de salvar e botão para restaurar o visual padrão. Ao salvar, o painel e a página do cliente mudam na hora. |

### Contas e permissões

- **Acesso total** (conta sem profissional vinculado): vê e altera tudo da clínica.
- **Conta de profissional**: só vê e altera o que é daquele profissional (agendamentos, agenda, horários, folgas, clientes e relatório próprios). Não acessa Tratamentos, Configurações nem Personalização.
- **Profissional administrador** (conta de profissional marcada como "também é administrador da clínica", para o dono ou responsável que também atende): nos **agendamentos** continua vendo só os próprios (quadro, agenda, clientes e avisos), mas **administra o resto da clínica** como o acesso total: tratamentos, profissionais, horários e folgas de todos, feriados, relatórios e lucro da clínica, usuários, configurações e personalização.
- Sempre fica pelo menos uma conta que administra a clínica (acesso total ou profissional administrador).
- As regras de permissão são conferidas no servidor, não só na tela.

### Visual

- Todas as telas são **responsivas**: no celular o menu do painel vira uma gaveta, as tabelas viram cartões, o Kanban mostra uma coluna por vez (com abas) e as janelas sobem de baixo.
- Suporte a tema claro e escuro do sistema no painel.

---

## 3. Arquitetura

Sem entrar em detalhes técnicos, o sistema pode ser entendido como um conjunto de quatro partes que trabalham juntas:

| Parte | Função |
|---|---|
| Área do cliente | Espaço onde o cliente escolhe o profissional, o serviço, a data e o horário, e realiza, remarca ou cancela o agendamento. |
| Área da clínica (administrador) | Espaço onde a clínica cadastra profissionais, tratamentos e horários, e acompanha os atendimentos, a agenda, os clientes e os relatórios. |
| Regras dos agendamentos | Parte responsável por organizar o funcionamento dos agendamentos, por exemplo, mostrar apenas horários disponíveis, evitar conflitos e respeitar folgas e antecedência. |
| Armazenamento das informações | Parte responsável por guardar e organizar todas as informações do sistema. |

### Como as partes trabalham juntas

1. O cliente utiliza a **área do cliente** para solicitar um agendamento.
2. As **regras dos agendamentos** verificam se aquele horário está disponível e organizam a solicitação.
3. As informações são guardadas na parte de **armazenamento**.
4. A clínica, pela **área do administrador**, consulta essas mesmas informações e acompanha cada atendimento.

Dessa forma, cliente e clínica enxergam as mesmas informações, sempre atualizadas.

### Tecnologias utilizadas no desenvolvimento

| Parte do sistema | Tecnologia |
|---|---|
| Frontend (parte visual) | React com TypeScript (Vite) |
| Backend (regras e funcionamento interno) | Node.js com TypeScript (Express) |
| Base de dados | MySQL |

### Organização do backend (orientação a objetos)

O backend é todo organizado em classes, separadas em camadas:

| Pasta | O que contém |
|---|---|
| `server/src/module` | **Entidades e regras do domínio** (ex: `Agendamento`, `Cliente`, `Profissional`, `BloqueioAgenda`, `AgendaSemanal`). Cada entidade valida os próprios dados. |
| `server/src/services` | **Serviços**: casos de uso que combinam entidades e repositórios (ex: criar, remarcar e cancelar agendamentos). |
| `server/src/repositories` | **Repositórios**: leitura e gravação no MySQL. Todos herdam da classe abstrata `Repositorio`. |
| `server/src/controllers` | **Controllers**: recebem as requisições HTTP e chamam os serviços. Todos herdam da classe base `Controlador`. |
| `server/src/erros` | **Hierarquia de erros** (`ErroDaAplicacao` → não encontrado, sem acesso, conflito, autenticação), cada um com o seu status HTTP. |
| `server/src/middlewares` | Autenticação do painel e tratamento de erros inesperados. |

Exemplos dos pilares da orientação a objetos no projeto:

- **Encapsulamento:** atributos privados com métodos que aplicam as regras (ex: `Agendamento.remarcar()`, `Agendamento.registrarMensagem()`, `Agendamento.pertenceAoTelefone()`, que decide quem pode remarcar e cancelar pelo site).
- **Herança:** `Pessoa` → `Cliente`, `Profissional` e `Responsavel` (quem marca para outra pessoa); `Repositorio` → repositórios; `Controlador` → controllers; `ErroDaAplicacao` → tipos de erro.
- **Polimorfismo:** cada subclasse de `Pessoa` implementa `papel()` e `apresentar()` do seu jeito; `Agendamento.getContato()` devolve uma `Pessoa`, que é o `Responsavel` ou o próprio `Cliente`; cada tipo de erro define o seu `status`.
- **Abstração:** classes abstratas (`Pessoa`, `Repositorio`, `Controlador`, `ErroDaAplicacao`) e objetos de valor (`Horario`, `Telefone`, `DataAgenda`).

O frontend segue a mesma ideia: as regras de exibição ficam em classes de modelo (`client/src/models`) e o acesso à API em classes de serviço (`client/src/services`), que herdam de `ApiClient`.

---

## 4. Entidades

> Entidades são os principais elementos que fazem parte do funcionamento do sistema.

| Entidade | Papel no sistema |
|---|---|
| **Pessoa** | Representa as pessoas relacionadas ao sistema. Serve como base para o cliente, o profissional e o responsável. |
| **Cliente** | Pessoa que recebe o atendimento. É identificada pelo telefone + nome: o telefone é o contato de quem marcou, que pode ser outra pessoa (o agendamento guarda quem marcou). |
| **Profissional** | Pessoa que realiza os tratamentos na clínica. |
| **Responsável** | Pessoa que marcou o horário para outra usando o próprio telefone (ex.: a mãe para a filha). Recebe os avisos e pode remarcar ou cancelar com esse telefone. |
| **Tratamento** | Procedimento oferecido pela clínica, com valor, duração e o profissional que realiza. |
| **Agendamento** | Registro que reúne as informações de um atendimento: cliente, profissional, tratamentos, data, horário, etapa e as mensagens de WhatsApp enviadas. |
| **Horário** | Um horário da grade de 30 em 30 minutos (09:00, 09:30...). |
| **Horário disponível** | Um horário que a clínica liberou para um profissional num dia da semana. |
| **Bloqueio de agenda** | Período de folga, férias ou feriado em que a agenda fica fechada. |
| **Status do agendamento** | Situação do atendimento: agendado, em atendimento, finalizado ou não compareceu (falta). |
| **Forma de pagamento** | Como o cliente pretende pagar: Pix, cartão de crédito, cartão de débito ou dinheiro. |
| **Dia da semana** | Os dias em que a clínica realiza atendimentos. |
| **Histórico do cliente** | Reúne os agendamentos de um cliente e calcula total gasto, visitas, tratamentos mais feitos etc. |
| **Agenda semanal** | Monta a semana de um profissional, dizendo o que há em cada horário de cada dia. |
| **Relatório mensal** | Calcula o faturamento e os indicadores do mês. |
| **Administrador** | Conta de acesso ao painel, com acesso total ou ligada a um profissional. |

---

## 5. Relações

As entidades se conectam entre si para que o sistema funcione de forma organizada.

| Elementos | Como se relacionam | Explicação |
|---|---|---|
| Cliente e Agendamento | Um cliente pode realizar vários agendamentos | O mesmo cliente pode voltar à clínica e marcar novos atendimentos. O histórico junta todos pelo telefone e pelo nome de quem foi atendido. |
| Profissional e Agendamento | Um profissional pode realizar vários atendimentos | Cada profissional atende diversos clientes em diferentes dias e horários. |
| Tratamento e Profissional | Um tratamento pode ser de um profissional ou de todos | O tratamento pode ser exclusivo de um profissional ou oferecido por qualquer um da clínica. |
| Agendamento e Tratamento | Um agendamento pode ter vários tratamentos | O cliente pode fazer mais de um procedimento no mesmo horário; a duração e o valor são somados. |
| Profissional e Horário disponível | Cada profissional tem a sua grade semanal | Os horários livres para o cliente dependem da grade do profissional. |
| Profissional e Bloqueio de agenda | Um profissional pode ter várias folgas | Um bloqueio sem profissional vale para a clínica inteira (feriado). |
| Agendamento e Status | Cada agendamento possui um status | Permite saber se o atendimento está agendado, em andamento ou finalizado. |
| Administrador e Profissional | Uma conta pode estar ligada a um profissional | Define o que a conta pode ver e alterar no painel. |

---

## 6. Dados

O sistema precisa organizar alguns tipos de informações para funcionar corretamente:

| Tipo de informação | Por que é importante |
|---|---|
| **Dados dos clientes** (nome e telefone para contato) | Identificam quem realizou o agendamento, permitem o contato pelo WhatsApp e formam a ficha do cliente. |
| **Dados dos profissionais** | Permitem saber quem realiza cada tratamento e organizar a agenda de cada profissional. |
| **Informações dos tratamentos** (procedimentos, valores e duração) | Permitem que o cliente conheça as opções oferecidas e que a agenda reserve o tempo certo. |
| **Horários disponíveis** | Garantem que o cliente só escolha horários livres, evitando conflitos e marcações duplicadas. |
| **Folgas e feriados** | Fecham a agenda nos dias em que não há atendimento. |
| **Informações dos agendamentos** | Reúnem cliente, profissional, tratamentos, data e horário, formando o histórico de atendimentos da clínica. |
| **Situação de cada atendimento** | Permite à clínica acompanhar o andamento: o que está agendado, em atendimento e finalizado. |
| **Contas do painel** | Controlam quem acessa a área administrativa e o que cada conta pode ver. |

Manter essas informações organizadas e centralizadas é o que permite reduzir erros, evitar esquecimentos e dar à clínica uma visão clara do seu dia a dia.

---

## 7. Equipe

| Integrante | Função |
|---|---|
| Antonio Alexandre | QA |
| João Vitor | DevOps |
| Lucas Tavares | Back-end e Front-end |
| Pedro | Tech Lead |

### Papel de cada função no projeto

- **QA (garantia de qualidade):** verifica se o sistema funciona como esperado, procurando falhas e inconsistências antes de o sistema ser apresentado.
- **DevOps:** cuida da organização do ambiente do projeto e de manter o sistema disponível e funcionando de forma estável.
- **Back-end e Front-end:** responsável por construir tanto a parte interna do sistema, que organiza as regras e as informações, quanto a parte visual, que o cliente e a clínica utilizam.
- **Tech Lead:** lidera a equipe, orienta as decisões do projeto e acompanha o andamento do trabalho.

---

## 8. Infraestrutura e DevOps

Nesta seção explica como rodar o sistema e como o código é conferido automaticamente a cada Pull Request (instalação, lint e compilação). Os testes funcionais do sistema ficam com o QA.

### Como rodar localmente (sem Docker)

É preciso ter o **Node.js** e o **MySQL** instalados.

1. **Banco de dados:** crie o banco rodando o script `server/database/projetopoo_completo.sql` no MySQL. Ele cria o banco `projetopoo` e todas as tabelas, sem dados. As tabelas e colunas novas também são criadas sozinhas na primeira vez que o sistema as usa.
2. **Server:** copie `server/.env.example` para `server/.env` e preencha os dados do MySQL e o `ADMIN_TOKEN_SEGREDO`. Depois:

   ```bash
   cd serverS
   npm install
   npm run dev
   ```

   A API fica em `http://localhost:3000`.

3. **Client:** copie `client/.env.example` para `client/.env` (o `VITE_API_URL` aponta para a API). Depois:

   ```bash
   cd client
   npm install
   npm run dev
   ```

   O site abre no endereço mostrado no terminal (normalmente `http://localhost:5173`). O painel fica em `/admin`.

### Como rodar o server com Docker

Para rodar, é preciso ter o Docker Desktop instalado e aberto. Depois, no terminal:

```bash
cd server
docker build -t meu-server .
docker run -p 3000:3000 meu-server
```

O servidor fica disponível em `http://localhost:3000`. Para parar, use `Ctrl + C`.

Rodando sozinho, o server não encontra o banco de dados. Para ter o sistema completo, use o Docker Compose (seção abaixo).

### Como rodar o client com Docker

Com o Docker Desktop aberto, no terminal:

```bash
cd client
docker build --build-arg VITE_API_URL=http://localhost:3000 -t meu-client .
docker run -p 8090:80 meu-client
```

O site fica disponível em `http://localhost:8090`. Para parar, use `Ctrl + C`.

O endereço da API (`VITE_API_URL`) é passado no momento do build, porque o Vite o incorpora ao site compilado. O client usa o nginx para entregar os arquivos já compilados, por isso a porta dentro do container é a 80. No computador usamos a 8090 para não conflitar com o server, que usa a 3000.

### Como rodar o projeto completo com Docker Compose (recomendado)

O `docker-compose.yml` sobe o banco de dados (MySQL), o server e o client com um único comando, já ligados entre si.

Pré-requisito: ter o Docker Desktop instalado e aberto.

Na raiz do projeto, execute:

```bash
docker compose up --build
```

Quando terminar de subir, acesse o site em `http://localhost:8090`.

A API (server) roda na porta 3000 e é usada pelo site por trás dos panos. Ela não tem página inicial, então abrir `http://localhost:3000` no navegador mostra "Cannot GET /". Isso é normal e indica que o server está no ar.

Para conferir que os três serviços estão ativos, use:

```bash
docker compose ps
```

Para rodar em segundo plano (sem prender o terminal), use `docker compose up -d`.

Para desligar tudo, mantendo os dados do banco:

```bash
docker compose down
```

Atenção: `docker compose down -v` também apaga os dados do banco.

O banco é criado com as tabelas do arquivo `server/database/schema.sql`, mas começa sem registros. Os dados (profissionais, tratamentos, horários) precisam ser cadastrados pelo sistema.

| Serviço | Função | Porta no computador |
|---|---|---|
| `db` | Banco de dados MySQL | não exposta |
| `server` | API (Node.js), usada pelo site | 3000 |
| `client` | Site (React + nginx) | 8090 |



### Integração Contínua (CI)

O projeto usa GitHub Actions. Sempre que alguém abre um Pull Request, os workflows da pasta `.github/workflows` rodam sozinhos, instalam as dependências e compilam o código:

- `ci-server.yml`: instala e compila o server.
- `ci-client.yml`: instala, roda o lint e compila o client.

Se algum passo falhar, o Pull Request aparece como reprovado e o motivo pode ser consultado na aba **Actions** do GitHub.

Esses workflows não substituem os testes do QA. Eles só garantem que o código instala e compila antes de entrar na `main`.

---

## 9. Conclusão

O projeto busca resolver a dificuldade que muitas clínicas de estética têm para organizar horários, profissionais e atendimentos quando utilizam agendas de papel, mensagens ou outros métodos descentralizados.

O sistema ajuda a clínica ao reunir todas as informações em um só lugar. O cliente realiza o agendamento sozinho, escolhendo apenas entre horários realmente disponíveis, e pode remarcar ou cancelar sem precisar ligar. O administrador acompanha tudo por um quadro organizado por etapas (agendado, em atendimento e finalizado), pela agenda da semana, pelas fichas dos clientes e pelos relatórios de faturamento.

Com isso, a organização dos agendamentos melhora: diminuem os erros, os conflitos de horários e as faltas (com os lembretes pelo WhatsApp), e a clínica passa a ter um controle mais preciso e eficiente dos atendimentos, sem depender de ferramentas manuais.

Para o público-alvo, o projeto é importante porque simplifica a rotina do dono da clínica, que passa a se concentrar em acompanhar os agendamentos e atualizar a etapa de cada atendimento, enquanto os clientes ganham praticidade e autonomia para marcar seus procedimentos.
