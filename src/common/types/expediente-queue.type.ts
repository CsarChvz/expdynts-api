import { ExpedienteObjeto } from "@/common/types/expediente.type";

type Acuerdo = Record<string, any>; // flexible tipo JSON

interface PropsAcuerdos {
  usuarioExpediente: number;
  hashNuevo: string;
  acuerdosActuales: ExpedienteObjeto[];
}

interface ComparacionResultado {
  nuevoRegistro: boolean;
  haCambiado: boolean;
  mensaje: string;
  data?: {
    cambiosRealizados: ExpedienteObjeto[];
    expediente: {
      exp: number;
      fecha: number;
      cve_juz: string;
      extractoId: string;
    };
    atributosUsuario: {
      telefono: string;
    };
  };
}

export { Acuerdo, PropsAcuerdos, ComparacionResultado };
