import {Extractos} from '@/lib/types/expedientes'

import Foreanos from '@/lib/data/foreanos-judges'
import ZMCiudadJudicial from '@/lib/data/zm-judges'
import Penales from '@/lib/data/penales-judges'
import Orales_Y_Foreanos_Penales from '@/lib/data/orales_penales_foraneos-judges'
import Laborales from '@/lib/data/laborales-judge'

const extractos: Extractos[] = [
  {
    id: "ZM",
    name: "Ciudad Judicial",
    key_search: "zmg",
    juzgados: ZMCiudadJudicial,
    color: "blue",
  },
  {
    id: "FRNS",
    name: "Foraneos",
    key_search: "forean",
    juzgados: Foreanos,
    color: "green",
  },
  {
    id: "PENALT",
    name: "Penal Tradicional",
    key_search: "penal",
    juzgados: Penales,
    color: "red",
  },
  {
    id: "POPF",
    name: "Orales penales y penales foraneos",
    key_search: "penal_oral",
    juzgados: Orales_Y_Foreanos_Penales,
    color: "orange",
  },
  {
    id: "LABORAL",
    name: "Juzgados Laborales",
    key_search: "forean",
    juzgados: Laborales,
    color: "cyan",
  },
];

export default extractos;