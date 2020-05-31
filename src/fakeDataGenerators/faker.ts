import { lorem, random, internet, date, image } from "faker"
import { FakeDataGenerator } from "../fakeDataGeneratorAdapter"

export const faker: FakeDataGenerator = {
  string: () => lorem.text(),
  number: () => random.number(),
  url: () => internet.url(),
  imageUrl: () => image.imageUrl(),
  date: () => date.recent().toISOString(),
  past: () => date.past().toISOString(),
  future: () => date.future().toISOString(),
}
