/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

@Injectable()
export class HashService {
  // Clave secreta para cifrado, debe tener 32 bytes (256 bits)
  private readonly key = crypto
    .createHash("sha256")
    .update(String(process.env.ENCRYPTION_KEY || "clave-super-secreta"))
    .digest();

  private readonly ivLength = 16; // 128 bits

  /**
   * Genera un hash determinista (SHA-256) del texto proporcionado.
   * Ideal para verificar cambios.
   */
  async generarHash(texto: string): Promise<string> {
    return crypto.createHash("sha256").update(texto, "utf8").digest("hex");
  }

  /**
   * Cifra un texto utilizando AES-256-CBC y un IV aleatorio.
   * Ideal para almacenar contenido de forma segura.
   */
  async cifrarTexto(texto: string): Promise<string> {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv("aes-256-cbc", this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(texto, "utf8"),
      cipher.final(),
    ]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  /**
   * Descifra un texto cifrado con cifrarTexto.
   */
  async descifrarTexto(datoCifrado: string): Promise<string> {
    const [ivHex, encryptedHex] = datoCifrado.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }

  /**
   * Verifica si un texto dado coincide con un dato cifrado.
   */
  async verificarTexto(texto: string, datoCifrado: string): Promise<boolean> {
    try {
      const textoDescifrado = await this.descifrarTexto(datoCifrado);
      return texto === textoDescifrado;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  }
}
