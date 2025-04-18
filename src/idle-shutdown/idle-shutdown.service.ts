import { Injectable, OnModuleInit } from "@nestjs/common";
import { Server } from "http";

@Injectable()
export class IdleShutdownService implements OnModuleInit {
  private idleTimeout = 10 * 60 * 1000; // 10 minutos en milisegundos
  private lastActivity: number = Date.now();
  private checkInterval: NodeJS.Timeout;
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  onModuleInit() {
    this.checkInterval = setInterval(() => this.checkIdleTime(), 60000); // Revisa cada minuto
  }

  registerActivity() {
    this.lastActivity = Date.now();
  }

  private checkIdleTime() {
    const currentTime = Date.now();
    const idleTime = currentTime - this.lastActivity;

    if (idleTime >= this.idleTimeout && this.server) {
      console.log("Sin actividad por 10 minutos, apagando servidor...");
      clearInterval(this.checkInterval);
      this.server.close(() => {
        console.log("Servidor apagado correctamente");
        process.exit(0); // Terminar el proceso completamente
      });
    }
  }
}
