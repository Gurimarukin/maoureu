import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import { DomHandler } from '../helpers/DomHandler'
import { NonEmptyArray } from '../utils/fp'
import { Either } from '../utils/fp'
import type { PostId } from './PostId'
import { Validation, lift } from './Validation'

export type Post = {
  readonly id: PostId
  readonly link: string
  readonly date: string
  readonly title: string
  readonly paragraphs: NonEmptyArray<string>
  readonly images: NonEmptyArray<string>
}

type FromBlogPostArgs = {
  readonly html: string
  readonly id: PostId
  readonly link: string
}

const fromBlogPost = ({ html, id, link }: FromBlogPostArgs): Validation<Post> => {
  const domHandler = DomHandler.of(html)
  return apply.sequenceS(Validation.validation)({
    id: Either.right(id),
    link: Either.right(link),
    date: parseDate(domHandler),
    title: parseTitle(domHandler),
    paragraphs: parseParagraphs(domHandler),
    images: parseImages(domHandler),
  })
}

const parseDate = (domHandler: DomHandler): Validation<string> =>
  pipe(
    domHandler.document,
    domHandler.querySelectorTextContent('div.post-header > p.post-date'),
    lift('date'),
  )

const parseTitle = (domHandler: DomHandler): Validation<string> =>
  pipe(
    domHandler.document,
    domHandler.querySelectorTextContent('div.post-header > h1.post-title'),
    lift('title'),
  )

const parseParagraphs = (domHandler: DomHandler): Validation<NonEmptyArray<string>> => {
  const selector = 'div.post-content > p'
  return pipe(
    domHandler.document,
    DomHandler.querySelectorAllNonEmpty(selector, domHandler.HTMLParagraphElement),
    Either.map(
      NonEmptyArray.mapWithIndex((i, p) => pipe(p, DomHandler.textContent(selector), lift(`${i}`))),
    ),
    Either.chain(([head, ...tail]) => apply.sequenceT(Validation.validation)(head, ...tail)),
  )
}

const parseImages = (domHandler: DomHandler): Validation<NonEmptyArray<string>> =>
  pipe(
    domHandler.document,
    DomHandler.querySelectorAllNonEmpty('ul.slides > li > img', domHandler.HTMLImageElement),
    Either.map(NonEmptyArray.map(img => img.srcset)),
  )

export const Post = { fromBlogPost }
