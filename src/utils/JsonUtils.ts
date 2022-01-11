import { json } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'

import type { File } from '../models/FileOrDir'
import { FsUtils } from './FsUtils'
import type { Tuple } from './fp'
import { Either, Future } from './fp'
import { decodeError } from './ioTsUtils'
import { unknownToError } from './unknownToError'

type StringifyOpts = {
  readonly pretty?: boolean
}

const stringify =
  <O, A>(encoder: Encoder<O, A>, { pretty = false }: StringifyOpts = {}) =>
  (a: A): string => {
    const encoded = encoder.encode(a)
    return pretty ? JSON.stringify(encoded, null, 2) : JSON.stringify(encoded)
  }

const parseFile =
  <A>([decoder, decoderName]: Tuple<Decoder<unknown, A>, string>) =>
  (file: File): Future<A> =>
    pipe(
      FsUtils.readFileString(file),
      Future.map(json.parse),
      Future.map(Either.mapLeft(unknownToError)),
      Future.chain(Future.fromEither),
      Future.map(u => pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u)))),
      Future.chain(Future.fromEither),
    )

export const JsonUtils = { stringify, parseFile }
