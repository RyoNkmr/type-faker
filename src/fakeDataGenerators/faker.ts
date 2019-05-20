import faker from 'faker'
import { FakeDataGenerator } from '../fakeDataGeneratorAdapter'

export default {
  string: () => faker.lorem.text(),
  number: () => faker.random.number(),
  url: () => faker.internet.url(),
  imageUrl: () => faker.image.imageUrl(),
  date: () => faker.date.recent().toISOString(),
  past: () => faker.date.past().toISOString(),
  future: () => faker.date.future().toISOString(),
} as FakeDataGenerator