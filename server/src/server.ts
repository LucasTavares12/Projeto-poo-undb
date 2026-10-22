import "dotenv/config";
import { App } from "./App";

// Ponto de entrada: só cria a aplicação e sobe o servidor.
new App().iniciar(App.portaConfigurada());
