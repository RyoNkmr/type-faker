import { initializeEnvironment, scan, TypeTree } from "../src/typeParser"

describe("simpleCase", () => {
  test("Answer to the Ultimate Question of Life, the Universe, and Everything", () => {
    const { typeChecker, manager, source } = initializeEnvironment(
      "./specs/fixtures/simple.d.ts"
    )
    scan(typeChecker, manager)(source)

    const expected: TypeTree = {
      TypeAlias: {
        types: ["number"],
      },
      Piyo: {
        types: ["number", "string"],
      },
      Foo: {
        props: {
          foo: {
            types: ["string[]"],
          },
          bar: {
            types: ["number[]"],
          },
        },
      },
      Fuga: {
        props: {
          address: {
            types: ["string"],
          },
          foo: {
            types: ["Foo", "null", "undefined"],
          },
          hoge: {
            types: [
              {
                fuga: {
                  types: ["string", "undefined"],
                },
              },
              "undefined",
            ],
          },
          ho: {
            types: ["Hoge"],
          },
        },
      },
      Hoge: {
        props: {
          name: {
            types: ["string"],
          },
          id: {
            types: ["number", "string"],
          },
          hoge: {
            types: ["number", "undefined"],
          },
          fuga: {
            types: ["number", "null"],
          },
          fuga2: {
            types: ["number", "undefined"],
          },
          n: {
            types: ["null"],
          },
          u: {
            types: ["undefined"],
          },
        },
      },
    }
    expect(manager.getRegistry()).toEqual(expected)
  })
})
