import { pipe } from 'fp-ts/function'

import type { DomHandler } from '../helpers/DomHandler'
import { Either, List } from '../utils/fp'
import type { Validation } from './Validation'

export type BlogPage = List<string>

const fromDomHandler = (domHandler: DomHandler): Validation<BlogPage> =>
  pipe(
    domHandler.document,
    domHandler.querySelectorAllNonEmpty('div.posts > a.post', domHandler.HTMLAnchorElement),
    Either.map(List.map(a => a.href)),
  )

export const BlogPage = { fromDomHandler }
