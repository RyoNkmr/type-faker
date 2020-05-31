/*
import { typeFaker } from "../src/fakeDataGeneratorAdapter"

expect.extend({
  typeArrayContaining(received, types) {
    const pass = types.some(expect(received).toBeInstanceOf)
    return {
      pass,
      message: pass
        ? () => `Ok`
        : () => `expected ${received} to be any type of ${types.join(", ")}`,
    }
  },
  typeArrayContainingOrNull(received, types) {
    const pass =
      received === null || types.some(expect(received).toBeInstanceOf)
    return {
      pass,
      message: pass
        ? () => `Ok`
        : () =>
            `expected ${received} to be any type of ${types.join(
              ", "
            )} or null`,
    }
  },
  typeArrayContainingOrUndefined(received: any, types: Array<String | Number>) {
    const pass =
      typeof received === "undefined" ||
      types.some(expect(received).toBeInstanceOf)
    return {
      pass,
      message: pass
        ? () => `Ok`
        : () =>
            `expected ${received} to be any type of ${types
              .map((t) => t.toString())
              .join(", ")} or undefined`,
    }
  },
})

const createFaker = jest.fn()
const fakerMock = jest.fn()

describe("simpleCase", () => {
  it("calls faker API", () => {
    const typeFaker = createFaker(fakerMock)
    const schema = {
      Hoge: {
        props: {
          name: {
            types: ["string"],
          },
          id: {
            types: ["number", "string"],
          },
          stringArray: {
            types: ["string[]"],
          },
          nullableNumber: {
            types: ["number", "null"],
          },
          maybeNumber: {
            types: ["number", "undefined"],
          },
          shouldBeNull: {
            types: ["null"],
          },
          shouldBeUndefined: {
            types: ["undefined"],
          },
        },
      },
    }
    const fakeMock = typeFaker(schema)
    expect(fakeMock.Hoge.name).toBeInstanceOf(String)
    expect(fakeMock.Hoge.name).typeArrayContaining([String, Number])
    expect(fakeMock.Hoge.name).toBeInstanceOf(String)
  })
})
*/
