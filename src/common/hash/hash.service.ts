import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class HashService {
  private readonly saltRounds = 8;

  async acuerdos(texto: string): Promise<string> {
    return await bcrypt.hash(texto, this.saltRounds);
  }

  async verificarAcuerdo(texto: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(texto, hash);
  }
}
