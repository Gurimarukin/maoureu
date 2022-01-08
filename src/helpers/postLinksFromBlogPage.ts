import { pipe } from 'fp-ts/function'

import type { Validation } from '../models/Validation'
import { Either, List } from '../utils/fp'
import { DomHandler } from './DomHandler'

export const postLinksFromBlogPage = (html: string): Validation<List<string>> => {
  const domHandler = DomHandler(html)
  return pipe(
    domHandler.document,
    domHandler.querySelectorAllNonEmpty('div.posts > a.post', domHandler.HTMLAnchorElement),
    Either.map(List.map(a => a.href)),
  )
}
