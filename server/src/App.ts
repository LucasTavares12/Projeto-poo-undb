import express, { Express } from "express";
import cors from "cors";
import { HealthController } from "./controllers/HealthController";
import { ProfissionalController } from "./controllers/ProfissionalController";
import { TratamentoController } from "./controllers/TratamentoController";
import { HorarioDisponivelController } from "./controllers/HorarioDisponivelController";
import { AgendamentoController } from "./controllers/AgendamentoController";
import { ErrorHandlerMiddleware } from "./middlewares/ErrorHandlerMiddleware";

/**
 * Classe responsável por montar a aplicação Express: middlewares, rotas
 * e o próprio servidor HTTP. Novos controllers serão registrados em
 * `configurarRotas()` à medida que forem criados.
 */
export class App {
  private readonly app: Express;
  private readonly healthController = new HealthController();
  private readonly profissionalController = new ProfissionalController();
  private readonly tratamentoController = new TratamentoController();
  private readonly horarioDisponivelController = new HorarioDisponivelController();
  private readonly agendamentoController = new AgendamentoController();
  private readonly errorHandlerMiddleware = new ErrorHandlerMiddleware();

  constructor() {
    this.app = express();

    this.configurarMiddlewares();
    this.configurarRotas();
    this.configurarTratamentoDeErros();
  }

  private configurarMiddlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  /** Precisa ser registrado DEPOIS das rotas: só assim o Express sabe que é um error handler. */
  private configurarTratamentoDeErros(): void {
    this.app.use((erro: Error, req: express.Request, res: express.Response, next: express.NextFunction) =>
      this.errorHandlerMiddleware.tratar(erro, req, res, next)
    );
  }

  private configurarRotas(): void {
    this.app.get("/health", (req, res) => this.healthController.check(req, res));
    this.app.get("/health/db", (req, res) => this.healthController.checkDatabase(req, res));

    this.configurarRotasDeProfissionais();
    this.configurarRotasDeTratamentos();
    this.configurarRotasDeHorariosDisponiveis();
    this.configurarRotasDeAgendamentos();
  }

  private configurarRotasDeProfissionais(): void {
    this.app.get("/profissionais", (req, res) => this.profissionalController.listar(req, res));
    this.app.post("/profissionais", (req, res) => this.profissionalController.criar(req, res));
    this.app.put("/profissionais/:id", (req, res) =>
      this.profissionalController.atualizar(req, res)
    );
    this.app.delete("/profissionais/:id", (req, res) =>
      this.profissionalController.deletar(req, res)
    );
  }

  private configurarRotasDeTratamentos(): void {
    this.app.get("/tratamentos", (req, res) => this.tratamentoController.listar(req, res));
    this.app.post("/tratamentos", (req, res) => this.tratamentoController.criar(req, res));
    this.app.put("/tratamentos/:id", (req, res) => this.tratamentoController.atualizar(req, res));
    this.app.delete("/tratamentos/:id", (req, res) => this.tratamentoController.deletar(req, res));
  }

  private configurarRotasDeHorariosDisponiveis(): void {
    this.app.get("/profissionais/:profissionalId/horarios", (req, res) =>
      this.horarioDisponivelController.listarPorProfissional(req, res)
    );
    this.app.post("/horarios", (req, res) => this.horarioDisponivelController.criar(req, res));
    this.app.delete("/horarios/:id", (req, res) =>
      this.horarioDisponivelController.deletar(req, res)
    );
  }

  private configurarRotasDeAgendamentos(): void {
    this.app.get("/disponibilidade", (req, res) =>
      this.agendamentoController.disponibilidade(req, res)
    );
    this.app.get("/agendamentos", (req, res) => this.agendamentoController.listar(req, res));
    this.app.post("/agendamentos", (req, res) => this.agendamentoController.criar(req, res));
    this.app.patch("/agendamentos/:id/status", (req, res) =>
      this.agendamentoController.atualizarStatus(req, res)
    );
  }

  public getExpressApp(): Express {
    return this.app;
  }

  public iniciar(porta: number): void {
    this.app.listen(porta, () => {
      console.log(`Servidor rodando em http://localhost:${porta}`);
    });
  }
}
