type TypeAlias = number
type Piyo = number | string
type Foo = {
  foo: Array<string>;
  bar: number[];
}
type Fuga = {
  address: string;
  foo?: Foo;
  hoge: {
    fuga: string
  }
  ho: Hoge
}
interface Hoge {
  name: string;
  id: number | string;
  hoge?: number;
  fuga: number | null;
  fuga2: number | undefined;
  n: null;
  u: undefined
}
