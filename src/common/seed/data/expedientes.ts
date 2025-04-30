// Tipos basados en el esquema proporcionado
export type EstadoExpediente = "ACTIVE" | "ARCHIVED";

export interface ExpedienteObjeto {
  EXP: string
  TIPO: string
  FCH_ACU: string
  CVE_JUZ: string
  act_names: string
  dem_names: string
}

export interface BusquedaParams {
  extractoTab: string
  juzgadoIndividual: string
  numeroExpediente: number
  añoExpediente: Date
}

export type Juzgado = {
  id: number;
  clave_juzgado: string;
  nombre_juzgado: string;
  direccion?: string;
};

export type Expediente = {
  id: number;
  exp: number;
  fecha: string;
  juzgadoId: number;
  juzgado?: Juzgado;
  acuerdosNuevos: string;
  acuerdosAnteriores: string;
  hashNuevo: string;
  hashAnterior: string;
  createdAt: string;
  updatedAt: string;
  estado?: EstadoExpediente;
};

// Datos de ejemplo para mostrar en la tabla
export const juzgadosData: Juzgado[] = [
  {
    id: 1,
    clave_juzgado: "JC001",
    nombre_juzgado: "Juzgado Civil 1",
    direccion: "Av. Juárez 123, Centro",
  },
  {
    id: 2,
    clave_juzgado: "JC002",
    nombre_juzgado: "Juzgado Civil 2",
    direccion: "Av. Reforma 456, Centro",
  },
  {
    id: 3,
    clave_juzgado: "JP001",
    nombre_juzgado: "Juzgado Penal 1",
    direccion: "Av. Insurgentes 789, Centro",
  },
];

export const expedientesData: Expediente[] = [
  {
    id: 1,
    exp: 12345,
    fecha: "2023-04-15",
    juzgadoId: 1,
    juzgado: juzgadosData.find((j) => j.id === 1),
    acuerdosNuevos: "Acuerdo de audiencia preliminar",
    acuerdosAnteriores: "",
    hashNuevo: "a1b2c3d4e5f6",
    hashAnterior: "",
    createdAt: "2023-04-15T10:30:00Z",
    updatedAt: "2023-04-15T10:30:00Z",
    estado: "ACTIVE",
  },
  {
    id: 2,
    exp: 23456,
    fecha: "2023-04-16",
    juzgadoId: 2,
    juzgado: juzgadosData.find((j) => j.id === 2),
    acuerdosNuevos: "Resolución de amparo",
    acuerdosAnteriores: "Solicitud de amparo",
    hashNuevo: "f6e5d4c3b2a1",
    hashAnterior: "1a2b3c4d5e6f",
    createdAt: "2023-04-16T09:15:00Z",
    updatedAt: "2023-04-16T14:20:00Z",
    estado: "ACTIVE",
  },
  {
    id: 3,
    exp: 34567,
    fecha: "2023-04-17",
    juzgadoId: 1,
    juzgado: juzgadosData.find((j) => j.id === 1),
    acuerdosNuevos: "Citación a las partes",
    acuerdosAnteriores: "",
    hashNuevo: "z9y8x7w6v5u4",
    hashAnterior: "",
    createdAt: "2023-04-17T11:45:00Z",
    updatedAt: "2023-04-17T11:45:00Z",
    estado: "ARCHIVED",
  },
  {
    id: 4,
    exp: 45678,
    fecha: "2023-04-18",
    juzgadoId: 3,
    juzgado: juzgadosData.find((j) => j.id === 3),
    acuerdosNuevos: "Sentencia definitiva",
    acuerdosAnteriores: "Alegatos finales",
    hashNuevo: "p0o9i8u7y6t5",
    hashAnterior: "5t6y7u8i9o0p",
    createdAt: "2023-04-18T13:20:00Z",
    updatedAt: "2023-04-18T16:30:00Z",
    estado: "ACTIVE",
  },
  {
    id: 5,
    exp: 56789,
    fecha: "2023-04-19",
    juzgadoId: 2,
    juzgado: juzgadosData.find((j) => j.id === 2),
    acuerdosNuevos: "Admisión de pruebas",
    acuerdosAnteriores: "Ofrecimiento de pruebas",
    hashNuevo: "m1n2b3v4c5x6",
    hashAnterior: "6x5c4v3b2n1m",
    createdAt: "2023-04-19T10:00:00Z",
    updatedAt: "2023-04-19T10:00:00Z",
    estado: "ARCHIVED",
  },
  {
    id: 6,
    exp: 67890,
    fecha: "2023-04-20",
    juzgadoId: 3,
    juzgado: juzgadosData.find((j) => j.id === 3),
    acuerdosNuevos: "Resolución de recurso",
    acuerdosAnteriores: "Presentación de recurso",
    hashNuevo: "q1w2e3r4t5y6",
    hashAnterior: "6y5t4r3e2w1q",
    createdAt: "2023-04-20T14:25:00Z",
    updatedAt: "2023-04-20T14:25:00Z",
    estado: "ACTIVE",
  },
  {
    id: 7,
    exp: 78901,
    fecha: "2023-04-21",
    juzgadoId: 1,
    juzgado: juzgadosData.find((j) => j.id === 1),
    acuerdosNuevos: "Audiencia de pruebas",
    acuerdosAnteriores: "",
    hashNuevo: "a7s8d9f0g1h2",
    hashAnterior: "",
    createdAt: "2023-04-21T09:30:00Z",
    updatedAt: "2023-04-21T09:30:00Z",
    estado: "ACTIVE",
  },
  {
    id: 8,
    exp: 89012,
    fecha: "2023-04-22",
    juzgadoId: 2,
    juzgado: juzgadosData.find((j) => j.id === 2),
    acuerdosNuevos: "Sentencia interlocutoria",
    acuerdosAnteriores: "Solicitud de medida cautelar",
    hashNuevo: "z1x2c3v4b5n6",
    hashAnterior: "6n5b4v3c2x1z",
    createdAt: "2023-04-22T11:15:00Z",
    updatedAt: "2023-04-22T11:15:00Z",
    estado: "ARCHIVED",
  },
  {
    id: 9,
    exp: 90123,
    fecha: "2023-04-23",
    juzgadoId: 3,
    juzgado: juzgadosData.find((j) => j.id === 3),
    acuerdosNuevos: "Auto de apertura a juicio",
    acuerdosAnteriores: "Diligencias preliminares",
    hashNuevo: "l1k2j3h4g5f6",
    hashAnterior: "f6g5h4j3k2l1",
    createdAt: "2023-04-23T12:00:00Z",
    updatedAt: "2023-04-23T12:00:00Z",
    estado: "ACTIVE",
  },
  {
    id: 10,
    exp: 10234,
    fecha: "2023-04-24",
    juzgadoId: 1,
    juzgado: juzgadosData.find((j) => j.id === 1),
    acuerdosNuevos: "Notificación de resolución",
    acuerdosAnteriores: "",
    hashNuevo: "u7y6t5r4e3w2",
    hashAnterior: "",
    createdAt: "2023-04-24T09:40:00Z",
    updatedAt: "2023-04-24T09:40:00Z",
    estado: "ACTIVE",
  },
  {
    id: 11,
    exp: 11245,
    fecha: "2023-04-25",
    juzgadoId: 2,
    juzgado: juzgadosData.find((j) => j.id === 2),
    acuerdosNuevos: "Decreto de ejecución",
    acuerdosAnteriores: "Sentencia firme",
    hashNuevo: "g7h8j9k0l1m2",
    hashAnterior: "2m1l0k9j8h7g",
    createdAt: "2023-04-25T13:10:00Z",
    updatedAt: "2023-04-25T13:10:00Z",
    estado: "ARCHIVED",
  },
  {
    id: 12,
    exp: 12256,
    fecha: "2023-04-26",
    juzgadoId: 3,
    juzgado: juzgadosData.find((j) => j.id === 3),
    acuerdosNuevos: "Designación de perito",
    acuerdosAnteriores: "Solicitud de peritaje",
    hashNuevo: "x3c4v5b6n7m8",
    hashAnterior: "8m7n6b5v4c3x",
    createdAt: "2023-04-26T10:30:00Z",
    updatedAt: "2023-04-26T10:30:00Z",
    estado: "ACTIVE",
  },
  {
    id: 13,
    exp: 13267,
    fecha: "2023-04-27",
    juzgadoId: 1,
    juzgado: juzgadosData.find((j) => j.id === 1),
    acuerdosNuevos: "Apertura a prueba",
    acuerdosAnteriores: "",
    hashNuevo: "q2w3e4r5t6y7",
    hashAnterior: "",
    createdAt: "2023-04-27T08:55:00Z",
    updatedAt: "2023-04-27T08:55:00Z",
    estado: "ARCHIVED",
  },
  {
    id: 14,
    exp: 14278,
    fecha: "2023-04-28",
    juzgadoId: 2,
    juzgado: juzgadosData.find((j) => j.id === 2),
    acuerdosNuevos: "Informe pericial",
    acuerdosAnteriores: "Designación de perito",
    hashNuevo: "n9m8b7v6c5x4",
    hashAnterior: "4x5c6v7b8m9n",
    createdAt: "2023-04-28T11:05:00Z",
    updatedAt: "2023-04-28T11:05:00Z",
    estado: "ACTIVE",
  },
  {
    id: 15,
    exp: 15289,
    fecha: "2023-04-29",
    juzgadoId: 3,
    juzgado: juzgadosData.find((j) => j.id === 3),
    acuerdosNuevos: "Clausura del periodo de prueba",
    acuerdosAnteriores: "Recepción de pruebas",
    hashNuevo: "b1v2c3x4z5a6",
    hashAnterior: "6a5z4x3c2v1b",
    createdAt: "2023-04-29T15:00:00Z",
    updatedAt: "2023-04-29T15:00:00Z",
    estado: "ACTIVE",
  },
  {
    id: 16,
    exp: 16290,
    fecha: "2023-04-30",
    juzgadoId: 1,
    juzgado: juzgadosData.find((j) => j.id === 1),
    acuerdosNuevos: "Vista al Ministerio Público",
    acuerdosAnteriores: "",
    hashNuevo: "t8y9u0i1o2p3",
    hashAnterior: "",
    createdAt: "2023-04-30T14:10:00Z",
    updatedAt: "2023-04-30T14:10:00Z",
    estado: "ACTIVE",
  },
  {
    id: 17,
    exp: 17301,
    fecha: "2023-05-01",
    juzgadoId: 2,
    juzgado: juzgadosData.find((j) => j.id === 2),
    acuerdosNuevos: "Revisión de medidas cautelares",
    acuerdosAnteriores: "Medidas iniciales",
    hashNuevo: "o9i8u7y6t5r4",
    hashAnterior: "4r5t6y7u8i9o",
    createdAt: "2023-05-01T09:20:00Z",
    updatedAt: "2023-05-01T09:20:00Z",
    estado: "ARCHIVED",
  },
  {
    id: 18,
    exp: 18312,
    fecha: "2023-05-02",
    juzgadoId: 3,
    juzgado: juzgadosData.find((j) => j.id === 3),
    acuerdosNuevos: "Resolución sobre costas",
    acuerdosAnteriores: "Sentencia interlocutoria",
    hashNuevo: "c3v4b5n6m7z8",
    hashAnterior: "8z7m6n5b4v3c",
    createdAt: "2023-05-02T12:50:00Z",
    updatedAt: "2023-05-02T12:50:00Z",
    estado: "ACTIVE",
  },
  {
    id: 19,
    exp: 19323,
    fecha: "2023-05-03",
    juzgadoId: 1,
    juzgado: juzgadosData.find((j) => j.id === 1),
    acuerdosNuevos: "Auto de sobreseimiento",
    acuerdosAnteriores: "Alegatos",
    hashNuevo: "d4f5g6h7j8k9",
    hashAnterior: "9k8j7h6g5f4d",
    createdAt: "2023-05-03T11:40:00Z",
    updatedAt: "2023-05-03T11:40:00Z",
    estado: "ARCHIVED",
  },
  {
    id: 20,
    exp: 20334,
    fecha: "2023-05-04",
    juzgadoId: 2,
    juzgado: juzgadosData.find((j) => j.id === 2),
    acuerdosNuevos: "Resolución de incidente",
    acuerdosAnteriores: "Planteamiento de incidente",
    hashNuevo: "s1d2f3g4h5j6",
    hashAnterior: "6j5h4g3f2d1s",
    createdAt: "2023-05-04T10:10:00Z",
    updatedAt: "2023-05-04T10:10:00Z",
    estado: "ACTIVE",
  },
  {
    id: 21,
    exp: 21345,
    fecha: "2023-05-05",
    juzgadoId: 3,
    juzgado: juzgadosData.find((j) => j.id === 3),
    acuerdosNuevos: "Sentencia ejecutoriada",
    acuerdosAnteriores: "Resolución sobre costas",
    hashNuevo: "k1l2m3n4b5v6",
    hashAnterior: "6v5b4n3m2l1k",
    createdAt: "2023-05-05T13:45:00Z",
    updatedAt: "2023-05-05T13:45:00Z",
    estado: "ARCHIVED",
  },
  {
    id: 22,
    exp: 22356,
    fecha: "2023-05-06",
    juzgadoId: 1,
    juzgado: juzgadosData.find((j) => j.id === 1),
    acuerdosNuevos: "Recepción de sentencia",
    acuerdosAnteriores: "Audiencia de juicio",
    hashNuevo: "z0x9c8v7b6n5",
    hashAnterior: "5n6b7v8c9x0z",
    createdAt: "2023-05-06T09:00:00Z",
    updatedAt: "2023-05-06T09:00:00Z",
    estado: "ACTIVE",
  },
  {
    id: 23,
    exp: 23367,
    fecha: "2023-05-07",
    juzgadoId: 2,
    juzgado: juzgadosData.find((j) => j.id === 2),
    acuerdosNuevos: "Auto de radicación",
    acuerdosAnteriores: "",
    hashNuevo: "r1t2y3u4i5o6",
    hashAnterior: "",
    createdAt: "2023-05-07T10:50:00Z",
    updatedAt: "2023-05-07T10:50:00Z",
    estado: "ARCHIVED",
  },
];


// Función para obtener un expediente por ID (simulando una llamada a API)
export async function getExpedienteById(id: number): Promise<Expediente | null> {
  // Simulando un retraso de red
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Simulando un error aleatorio para probar el manejo de errores (10% de probabilidad)
  if (Math.random() < 0.1) {
    throw new Error("Error al cargar el expediente")
  }

  return expedientesData.find((exp) => exp.id === id) || null
}

// Función para obtener todos los expedientes (simulando una llamada a API)
export async function getExpedientes(): Promise<Expediente[]> {
  // Simulando un retraso de red
  await new Promise((resolve) => setTimeout(resolve, 500))

  return expedientesData
}
