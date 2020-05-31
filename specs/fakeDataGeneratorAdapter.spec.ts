import {
  createAdapter,
  FakeDataGenerator,
  FakeDataGeneratorAdapter,
} from "../src/fakeDataGeneratorAdapter"

const mockGenerator = {
  string: () => "text",
  number: () => 42,
  url: () => "https://ryonkmr.com",
  imageUrl: () => "https://ryonkmr.com/example.jpg",
  date: () => "2019-05-20T12:57:22.201Z",
  past: () => "2018-04-04T02:28:02.201Z",
  future: () => "2099-04-04T02:28:02.201Z",
} as FakeDataGenerator

describe("adapter", () => {
  let adapter: FakeDataGeneratorAdapter

  describe("no definition", () => {
    beforeEach(() => {
      adapter = createAdapter(mockGenerator)()
    })

    test.each`
      key                   | type          | value
      ${"stringValue"}      | ${"string"}   | ${"text"}
      ${"numberValue"}      | ${"number"}   | ${42}
      ${"stringArrayValue"} | ${"string[]"} | ${["text", "text", "text"]}
      ${"numberArrayValue"} | ${"number[]"} | ${[42, 42, 42]}
    `("returns specified typed general value", ({ key, type, value }) => {
      const actual = adapter(key, type)
      expect(actual).toEqual(value)
    })
  })

  describe("with definitions", () => {
    beforeEach(() => {
      adapter = createAdapter(mockGenerator)(
        {
          url: (a) => a.url(),
          imageUrl: (a) => a.imageUrl(),
          "/\\wUrl/": (a) => a.url(),
          "/\\wAt/": (a) => a.past(),
          "/^mayBe\\w/": (a) => undefined,
        },
        {
          arrayLength: 2,
        }
      )
    })

    test.each`
      key                   | type          | value
      ${"url"}              | ${"string"}   | ${"https://ryonkmr.com"}
      ${"imageUrl"}         | ${"string"}   | ${"https://ryonkmr.com/example.jpg"}
      ${"urls"}             | ${"string[]"} | ${["https://ryonkmr.com", "https://ryonkmr.com"]}
      ${"imageUrls"}        | ${"string[]"} | ${["https://ryonkmr.com/example.jpg", "https://ryonkmr.com/example.jpg"]}
      ${"movieUrl"}         | ${"string"}   | ${"https://ryonkmr.com"}
      ${"createdAt"}        | ${"string"}   | ${"2018-04-04T02:28:02.201Z"}
      ${"mayBeNumber"}      | ${"number"}   | ${undefined}
      ${"stringValue"}      | ${"string"}   | ${"text"}
      ${"numberValue"}      | ${"number"}   | ${42}
      ${"stringArrayValue"} | ${"string[]"} | ${["text", "text"]}
      ${"numberArrayValue"} | ${"number[]"} | ${[42, 42]}
    `("returns specified typed general value", ({ key, type, value }) => {
      const actual = adapter(key, type)
      expect(actual).toEqual(value)
    })
  })
})
