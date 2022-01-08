import { apply, number, ord } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { flow, pipe } from 'fp-ts/function'

import { DomHandler } from '../helpers/DomHandler'
import { Maybe, NonEmptyArray } from '../utils/fp'
import { Either } from '../utils/fp'
import type { SrcSetDefinition } from '../utils/parseSrcset'
import { parseSrcset } from '../utils/parseSrcset'
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

const ordSrcSetDefinitionByWidth: Ord<SrcSetDefinition> = pipe(
  number.Ord,
  ord.contramap(({ width }) => width ?? 0),
)
const parseImages = (domHandler: DomHandler): Validation<NonEmptyArray<string>> =>
  pipe(
    domHandler.document,
    DomHandler.querySelectorAllNonEmpty(
      'div.post-container noscript > img',
      domHandler.HTMLImageElement,
    ),
    Either.map(
      NonEmptyArray.mapWithIndex((i, img) =>
        pipe(
          parseSrcset(img.srcset),
          Either.bimap(
            e => `parseSrcset Error:\n${e.stack}\nsrcset: ${img.srcset}`,
            flow(
              NonEmptyArray.fromReadonlyArray,
              Maybe.fold(
                () => img.src, // if empty srcset, just use src
                flow(NonEmptyArray.max(ordSrcSetDefinitionByWidth), ({ url }) => url),
              ),
            ),
          ),
          lift(`${i}`),
        ),
      ),
    ),
    Either.chain(([head, ...tail]) => apply.sequenceT(Validation.validation)(head, ...tail)),
  )

export const Post = { fromBlogPost }
