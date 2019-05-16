type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type ID = number;
type Name = string;
type URLString = string;

interface Address {
  city: string;
  country: string;
  state: string;
  lat: string;
  lng: string;
}

type Friend = Omit<User, 'friends'>

type User = {
  id: ID;
  name: Name;
  address: Address
  friends: Friend[]
  userIcon: URLString;
};
