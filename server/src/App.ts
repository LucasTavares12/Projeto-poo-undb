import express, { Express } from "express";
import { HealthController } from "./controllers/HealthController";

/**
 * Classe responsável por montar a aplicação Express: middlewares, rotas
 * e o próprio servidor HTTP. Novos controllers serão registrados em
 * `configurarRotas()` à medida que forem criados.
 */
export class App {
  private readonly app: Express;
  private readonly healthController: HealthController;

  constructor() {
    this.app = express();
    this.healthController = new HealthController();

    this.configurarMiddlewares();
    this.configurarRotas();
  }

  private configurarMiddlewares(): void {
    this.app.use(express.json());
  }

  private configurarRotas(): void {
    this.app.get("/health", (req, res) => this.healthController.check(req, res));
    this.app.get("/health/db", (req, res) => this.healthController.checkDatabase(req, res));
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
