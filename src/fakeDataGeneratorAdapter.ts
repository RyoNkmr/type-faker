import { singularize } from 'inflected'

export interface FakeDataGenerator {
  string(): string
  number(): number
  url(): string
  imageUrl(): string
  date(): string
  past(): string
  future(): string
}

type GenerateFunction = (generator: FakeDataGenerator) => string | number | null | undefined
type CustomAdapterDefinitions = {
  [key: string]: GenerateFunction
}

const emptyAdapterDefinitions: CustomAdapterDefinitions = {
  null: () => null,
  undefined: () => undefined,
}

type AdapterOptions = {
  isExtendingDefault?: boolean
  arrayLength?: number,
}
const defaultAdapterOptions: Required<AdapterOptions> = {
  isExtendingDefault: true,
  arrayLength: 3,
}

type SupportedJSPrimitiveTypes =
  | 'string'
  | 'number'
  | 'null'
  | 'undefined'

type SupportedJSTypes =
  | SupportedJSPrimitiveTypes
  | 'string[]'
  | 'number[]'

export type FakeDataGeneratorAdapter = (key: string, type: SupportedJSTypes) => ReturnType<GenerateFunction> | ReturnType<GenerateFunction>[]

const parseTypeString = (typeString: SupportedJSTypes) => {
  const result = /(\w+)(\[\])?/.exec(typeString)
  if (result === null) {
    throw new Error(`Invalid argument Error`)
  }
  return { type: result[1] as SupportedJSPrimitiveTypes, isArray: !!result[2] }
}

const parseRegExpPattern = (key: string): string => {
  const [, pattern] = /^\/(.+)\/$/.exec(key) || [, key]
  return pattern
}

export const createAdapter = (fakeDataGenerator: FakeDataGenerator) => (definitions: CustomAdapterDefinitions = {}, options: AdapterOptions = {}): FakeDataGeneratorAdapter => {
  const { arrayLength, isExtendingDefault } = { ...defaultAdapterOptions, ...options }
  const adapterDefinitions = isExtendingDefault
    ? { ...emptyAdapterDefinitions, ...fakeDataGenerator, ...definitions }
    : { ...emptyAdapterDefinitions, ...definitions }
  const adapters = Object.entries(adapterDefinitions).map(([key, fn]) => [new RegExp(parseRegExpPattern(key)), fn] as [RegExp, GenerateFunction])
  const findAdapter = (keys: string[]) => adapters.find(([regexp]) => keys.some((key) => regexp.test(key)))

  return (key: string, typeString: SupportedJSTypes) => {
    const { type, isArray } = parseTypeString(typeString)
    const singularKey = singularize(key);
    const keys = singularKey === key ? [singularKey, key] : [key]
    const resultWithKey = findAdapter(keys)

    if (resultWithKey !== undefined) {
      const value = resultWithKey[1](fakeDataGenerator)
      if (value == null || typeof value === type) {
        return isArray ? Array(arrayLength).fill(value) : value
      }
    }

    const [, fallbackGenerator] = findAdapter([type]) || [, () => undefined]
    const value = fallbackGenerator(fakeDataGenerator)
    return isArray ? Array(arrayLength).fill(value) : value
  }
}

export default createAdapter