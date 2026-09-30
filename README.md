# Projeto-poo-undb
Projeto de Programação Orientada a Objetos

# 📅 Sistema de Agendamento - Clínica de Estética

## 📖 Sobre o Projeto
Este projeto consiste num sistema de agendamento web completo, desenvolvido especificamente para uma clínica de estética. O objetivo central da aplicação é modernizar e automatizar o processo de marcação de procedimentos, proporcionando total autonomia aos clientes e um controlo visual e centralizado para a administração do negócio. 

Com a implementação deste sistema, a clínica elimina completamente a dependência de ferramentas manuais e agendas de papel. Isto simplifica o dia a dia do dono da clínica, oferecendo uma gestão mais precisa, rápida e altamente eficiente de todos os horários e serviços prestados.

## 🚀 Tecnologias Utilizadas
O sistema foi desenvolvido utilizando as seguintes tecnologias:
* **Frontend:** React com TypeScript
* **Backend:** Node.js com TypeScript
* **Base de Dados:** MySQL

## ✨ Funcionalidades Principais

### 👤 Fluxo do Cliente
A interface do cliente foi pensada para ser intuitiva, permitindo que as marcações sejam feitas sem a necessidade de intervenção humana (autoagendamento).
* **Seleção de Serviços e Profissionais:** O cliente pode escolher o tratamento/procedimento que deseja realizar e, caso a clínica possua mais de um especialista, selecionar o profissional da sua preferência.
* **Disponibilidade em Tempo Real:** O utilizador escolhe o dia desejado e o sistema exibe apenas os horários que estão de facto disponíveis para aquela data em específico.
* **Registo Simplificado:** Para finalizar a marcação, o cliente preenche apenas os dados essenciais: nome para identificação e número de contacto.

### ⚙️ Painel do Administrador (Admin)
O coração da gestão da clínica. O administrador possui ferramentas completas para configurar o negócio e acompanhar o fluxo de clientes.
* **Gestão Visual (Kanban):** O painel de acompanhamento de consultas funciona no formato Kanban, dividido em três colunas principais: *Agendados*, *Em atendimento* e *Finalizados*. O único trabalho do administrador é arrastar os agendamentos de uma etapa para a outra, dependendo da fase em que se encontra o atendimento.
* **Controlo de Serviços:** O admin pode registar e editar os tratamentos e procedimentos oferecidos, definindo os seus respetivos valores.
* **Gestão de Equipa e Horários:** Permite o registo dos profissionais da clínica, além da configuração dos dias de funcionamento e dos horários que ficarão disponíveis para o público.

## 🏗️ Arquitetura e Estrutura de Pastas
O sistema utiliza conceitos de Programação Orientada a Objetos (POO) e está organizado para facilitar o desenvolvimento, separando claramente as responsabilidades:

* **`POO/`**: Pasta raiz do projeto.
  * **`client/`**: Diretório onde está localizado todo o Frontend da aplicação (interface do cliente e painel do admin), desenvolvido em React e TypeScript.
  * **`server/`**: Diretório onde está localizado todo o Backend (lógica de negócio, regras de agendamento e ligação à base de dados MySQL), desenvolvido em Node.js e TypeScript.
