import { eq, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { StringUtils } from '../utils/StringUtils'
import { List, Maybe } from '../utils/fp'
import { fromNewtype } from '../utils/ioTsUtils'

export type PostId = Newtype<{ readonly PostId: unique symbol }, string>

const { wrap, unwrap } = iso<PostId>()

const codec = fromNewtype<PostId>(C.string)

const Eq: eq.Eq<PostId> = pipe(string.Eq, eq.contramap(unwrap))

const urlRegex = /^https?:\/\/[^\/]+(.*)$/
const fromUrl: (url: string) => Maybe<PostId> = flow(
  StringUtils.matcher1(urlRegex),
  Maybe.map(
    flow(
      string.trim,
      string.split('/'),
      List.filter(s => s !== ''),
      StringUtils.mkString('_'),
      StringUtils.cleanFileName,
      wrap,
    ),
  ),
)

export const PostId = { codec, Eq, wrap, unwrap, fromUrl }
