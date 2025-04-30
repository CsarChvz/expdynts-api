interface Juzgados {
  value: string;
  name: string;
  judge: string;
  id: string;
  key_search: string;
}
interface Extractos {
  id: string;
  name: string;
  key_search: string;
  juzgados: Juzgados[];
  color?: string;
}

export { Juzgados, Extractos };
