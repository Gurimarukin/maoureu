import { flow, pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import type { AnyNewtype, CarrierOf } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { StringUtils } from './StringUtils'
import { Either } from './fp'

const limit = 10000

export const decodeError =
  (name: string) =>
  (value: unknown) =>
  (error: D.DecodeError): Error =>
    Error(
      StringUtils.stripMargins(
        `Couldn't decode ${name}:
        |Error:
        |${pipe(D.draw(error), StringUtils.ellipse(limit))}
        |
        |Value: ${pipe(JSON.stringify(value), StringUtils.ellipse(limit))}`,
      ),
    )

export const fromNewtype = <N extends AnyNewtype = never>(
  codec: C.Codec<unknown, CarrierOf<N>, CarrierOf<N>>,
): C.Codec<unknown, CarrierOf<N>, N> => {
  const { wrap, unwrap } = iso<N>()
  return C.make(
    { decode: flow(codec.decode, Either.map(wrap)) },
    { encode: flow(unwrap, codec.encode) },
  )
}
