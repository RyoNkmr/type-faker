type Maybe<T> = T | undefined
type Nullable<T> = T | null
type ID = number
type Name = string
type URLString = string

interface Address {
  city: string
  country: string
  state: string
  lat: string
  lng: string
}

type Friend = Omit<User, "friends">

type User = {
  id: ID
  name: Name
  address: Address
  friends: Friend[]
  userIcon: Nullable<Maybe<URLString>>
}
