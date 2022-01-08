import { flow } from 'fp-ts/function'

import { StringUtils } from '../utils/StringUtils'
import type { Try } from '../utils/fp'
import { Either, NonEmptyArray } from '../utils/fp'

export type Validation<A> = Either<NonEmptyArray<string>, A>

const validation = Either.getApplicativeValidation(NonEmptyArray.getSemigroup<string>())

const toTry: <A>(validated: Validation<A>) => Try<A> = Either.mapLeft(
  flow(StringUtils.mkString('Validation(\n', '\n', '\n)'), Error),
)

export const Validation = { validation, toTry }

export const lift = (name: string): (<A>(e: Either<string, A>) => Validation<A>) =>
  Either.mapLeft(err => NonEmptyArray.of(`Failed to decode ${name}: ${err}`))
