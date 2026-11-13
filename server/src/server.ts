import "dotenv/config";
import { App } from "./App";
import { RelogioClinica } from "./module/RelogioClinica";

// Ponto de entrada: acerta o fuso da clínica, cria a aplicação e sobe o servidor.
RelogioClinica.configurarFuso();
new App().iniciar(App.portaConfigurada());
