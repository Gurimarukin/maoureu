import type { Encoder } from 'io-ts/Encoder'

type StringifyOpts = {
  readonly pretty?: boolean
}

const stringify =
  <O, A>(encoder: Encoder<O, A>, { pretty = false }: StringifyOpts = {}) =>
  (a: A): string => {
    const encoded = encoder.encode(a)
    return pretty ? JSON.stringify(encoded, null, 2) : JSON.stringify(encoded)
  }

export const JsonUtils = { stringify }
