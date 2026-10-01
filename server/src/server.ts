import "dotenv/config";
import { App } from "./App";

const PORTA = Number(process.env.PORT) || 3000;

const app = new App();
app.iniciar(PORTA);
