
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

Facilitar e organizar o processo de agendamento de procedimentos. O cliente escolhe o tratamento, o profissional e um horário disponível, e a clínica passa a ter uma visão centralizada de todos os atendimentos, podendo acompanhar cada agendamento.

### Como funciona de maneira geral

**Para o cliente:**

1. Escolhe o tratamento desejado.
2. Escolhe o profissional responsável, quando houver mais de um.
3. Escolhe uma data e um horário disponível para aquele dia.
4. Informa seu nome e telefone para contato e finaliza o agendamento.

**Para a clínica (administrador):**

- Visualiza todos os agendamentos que ainda serão realizados.
- Cadastra os profissionais.
- Cadastra os tratamentos, com seus respectivos valores.
- Define os dias de atendimento e os horários que ficarão disponíveis aos clientes.
- Acompanha os atendimentos em um painel dividido por etapas: **Agendado**, **Em atendimento** e **Finalizado**. Conforme o atendimento avança, o administrador move o agendamento de uma etapa para outra.

---

## 2. Arquitetura

Sem entrar em detalhes técnicos, o sistema pode ser entendido como um conjunto de quatro partes que trabalham juntas:

| Parte | Função |
|---|---|
| Área do cliente | Espaço onde o cliente escolhe o tratamento, o profissional, a data e o horário, e realiza o agendamento. |
| Área da clínica (administrador) | Espaço onde a clínica cadastra profissionais, tratamentos e horários, e acompanha os atendimentos. |
| Regras dos agendamentos | Parte responsável por organizar o funcionamento dos agendamentos, por exemplo, mostrar apenas horários disponíveis e evitar conflitos. |
| Armazenamento das informações | Parte responsável por guardar e organizar todas as informações do sistema. |

### Como as partes trabalham juntas

1. O cliente utiliza a **área do cliente** para solicitar um agendamento.
2. As **regras dos agendamentos** verificam se aquele horário está disponível e organizam a solicitação.
3. As informações são guardadas na parte de **armazenamento**.
4. A clínica, pela **área do administrador**, consulta essas mesmas informações e acompanha cada atendimento.

Dessa forma, cliente e clínica enxergam as mesmas informações, sempre atualizadas.

### Tecnologias utilizadas no desenvolvimento

O sistema será desenvolvido com as seguintes tecnologias:

| Parte do sistema | Tecnologia |
|---|---|
| Frontend (parte visual) | React com TypeScript |
| Backend (regras e funcionamento interno) | Node.js com TypeScript |
| Base de dados | MySQL |

---

## 3. Entidades

> Entidades são os principais elementos que fazem parte do funcionamento do sistema.

| Entidade | Papel no sistema |
|---|---|
| **Pessoa** | Representa as pessoas relacionadas ao sistema. Serve como base para o cliente e o profissional. |
| **Cliente** | Pessoa que realiza o agendamento. |
| **Profissional** | Pessoa que realiza os tratamentos na clínica. |
| **Tratamento** | Procedimento oferecido pela clínica, com seu respectivo valor. |
| **Agendamento** | Registro que reúne as informações de um atendimento: quem é o cliente, qual o profissional, qual o tratamento, a data e o horário. |
| **Horário** | Representa os horários disponíveis para atendimento. |
| **Status do agendamento** | Representa a situação do atendimento: agendado, em atendimento ou finalizado. |
| **Dia da semana** | Representa os dias em que a clínica realiza atendimentos. |

---

## 4. Relações

As entidades se conectam entre si para que o sistema funcione de forma organizada.

| Elementos | Como se relacionam | Explicação |
|---|---|---|
| Cliente e Agendamento | Um cliente pode realizar vários agendamentos | O mesmo cliente pode voltar à clínica e marcar novos atendimentos ao longo do tempo. |
| Profissional e Agendamento | Um profissional pode realizar vários atendimentos | Cada profissional atende diversos clientes em diferentes dias e horários. |
| Tratamento e Profissional | Um tratamento pode ser realizado por diferentes profissionais | Um mesmo procedimento pode ser oferecido por mais de um profissional da clínica. |
| Agendamento, Cliente, Profissional e Tratamento | Um agendamento está relacionado a um cliente, um profissional e um tratamento | O agendamento reúne, em um único registro, todas as informações do atendimento. |
| Profissional e Horário | Cada profissional possui horários em que pode realizar atendimentos | Os horários disponíveis dependem do profissional e dos dias em que a clínica atende. |
| Agendamento e Status | Cada agendamento possui um status | Permite saber se o atendimento está agendado, em andamento ou finalizado. |

---

## 5. Dados

O sistema precisa organizar alguns tipos de informações para funcionar corretamente:

| Tipo de informação | Por que é importante |
|---|---|
| **Dados dos clientes** (nome e telefone para contato) | Identificam quem realizou o agendamento e permitem que a clínica entre em contato quando necessário. |
| **Dados dos profissionais** | Permitem saber quem realiza cada tratamento e organizar a agenda de cada profissional. |
| **Informações dos tratamentos** (procedimentos e valores) | Permitem que o cliente conheça as opções oferecidas e que a clínica mantenha seu catálogo organizado. |
| **Horários disponíveis** | Garantem que o cliente só escolha horários livres, evitando conflitos e marcações duplicadas. |
| **Informações dos agendamentos** | Reúnem cliente, profissional, tratamento, data e horário, formando o histórico de atendimentos da clínica. |
| **Situação de cada atendimento** | Permite à clínica acompanhar o andamento: o que está agendado, o que está em atendimento e o que já foi finalizado. |

Manter essas informações organizadas e centralizadas é o que permite reduzir erros, evitar esquecimentos e dar à clínica uma visão clara do seu dia a dia.

---

## 6. Equipe

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

## 7. Conclusão

O projeto busca resolver a dificuldade que muitas clínicas de estética têm para organizar horários, profissionais e atendimentos quando utilizam agendas de papel, mensagens ou outros métodos descentralizados.

O sistema ajuda a clínica ao reunir todas as informações em um só lugar. O cliente realiza o agendamento sozinho, escolhendo apenas entre horários realmente disponíveis, e o administrador acompanha tudo por um painel organizado por etapas: agendado, em atendimento e finalizado.

Com isso, a organização dos agendamentos melhora: diminuem os erros e os conflitos de horários, e a clínica passa a ter um controle mais preciso e eficiente dos atendimentos, sem depender de ferramentas manuais.

Para o público-alvo, o projeto é importante porque simplifica a rotina do dono da clínica, que passa a se concentrar em acompanhar os agendamentos e atualizar a etapa de cada atendimento, enquanto os clientes ganham praticidade e autonomia para marcar seus procedimentos.
