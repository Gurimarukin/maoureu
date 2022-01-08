import { pipe } from 'fp-ts/function'

import type { DomDocument } from '../utils/DomUtils'
import { DomUtils } from '../utils/DomUtils'
import { Either, List } from '../utils/fp'
import type { Validation } from './Validation'

export type BlogPage = List<string>

const fromDocument = (document: DomDocument): Validation<BlogPage> =>
  pipe(
    DomUtils.querySelectorAllNonEmpty('div.posts > a.post', DomUtils.HTMLAnchorElement)(document),
    Either.map(List.map(a => a.href)),
  )

export const BlogPage = { fromDocument }
