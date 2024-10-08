export const nonNullable = <T>(value: T): value is NonNullable<T> => {
  return value != null
}
