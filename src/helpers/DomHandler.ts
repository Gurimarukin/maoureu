import { apply, predicate } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { DOMWindow } from 'jsdom'
import { JSDOM } from 'jsdom'

import { Validation } from '../models/Validation'
import { StringUtils } from '../utils/StringUtils'
import { Either, NonEmptyArray } from '../utils/fp'

const DomHandler = (html: string) => {
  const jsdom = new JSDOM(html)

  const { HTMLAnchorElement, HTMLDivElement, HTMLElement, HTMLHeadingElement, HTMLImageElement } =
    jsdom.window

  function querySelectorEnsureOne(
    selector: string,
  ): (parent: ParentNode) => Either<string, DomElement>
  function querySelectorEnsureOne<E extends DomElement>(
    selector: string,
    type: DomConstructor<E>,
  ): (parent: ParentNode) => Either<string, E>
  function querySelectorEnsureOne<E extends DomElement>(
    selector: string,
    type?: DomConstructor<E>,
  ) {
    return (parent: ParentNode): Either<string, DomElement | E> => {
      const res = parent.querySelectorAll(selector)
      const elt = res[0]

      if (elt === undefined) return Either.left(`No element matches selector: ${selector}`)
      if (1 < res.length) return Either.left(`More than one element matches selector: ${selector}`)

      if (type === undefined) return Either.right(elt)

      const isE = (e: DomElement): e is E => e instanceof type
      if (isE(elt)) return Either.right(elt)

      return Either.left(`Element don't have expected type: ${type.name}`)
    }
  }

  function querySelectorAllNonEmpty(
    selector: string,
  ): (parent: ParentNode) => Validation<NonEmptyArray<DomElement>>
  function querySelectorAllNonEmpty<E extends DomElement>(
    selector: string,
    type: DomConstructor<E>,
  ): (parent: ParentNode) => Validation<NonEmptyArray<E>>
  function querySelectorAllNonEmpty<E extends DomElement>(
    selector: string,
    type?: DomConstructor<E>,
  ): (parent: ParentNode) => Validation<NonEmptyArray<E>> {
    return (parent: ParentNode): Validation<NonEmptyArray<E>> => {
      const elts = parent.querySelectorAll(selector)

      const res = pipe(
        NonEmptyArray.fromReadonlyArray([...elts]),
        Either.fromOption(() => NonEmptyArray.of(`No element matches selector: ${selector}`)),
      )

      if (type === undefined) return res as Validation<NonEmptyArray<E>>

      const isE = (e: DomElement): e is E => e instanceof type
      return pipe(
        res,
        Either.chain(nea => {
          const [head, tail] = pipe(
            nea,
            NonEmptyArray.mapWithIndex(
              (i, e): Validation<E> =>
                isE(e)
                  ? Either.right(e)
                  : Either.left(
                      NonEmptyArray.of(
                        `Wrong Element for index ${i} matching "${selector}" - expected ${type.name} got ${e.nodeName}`,
                      ),
                    ),
            ),
            NonEmptyArray.unprepend,
          )
          return apply.sequenceT(Validation.validation)(head, ...tail)
        }),
      )
    }
  }

  const parseText = (parent: ParentNode, selector: string): Either<string, string> =>
    pipe(
      parent,
      querySelectorEnsureOne(selector, HTMLElement),
      Either.chain(elt =>
        pipe(
          elt.textContent,
          Either.fromNullable(`No textContent for element: ${selector}`),
          Either.map(StringUtils.cleanHtml),
        ),
      ),
      Either.filterOrElse(
        predicate.not(looksLikeHTMLTag),
        str => `textContent looks like an HTML tag and this might be a problem: ${str}`,
      ),
    )
  const looksLikeHTMLTag = (str: string): boolean => str.startsWith('<') && str.endsWith('/>')

  return {
    document: jsdom.window.document,
    querySelectorEnsureOne,
    querySelectorAllNonEmpty,
    parseText,

    HTMLAnchorElement,
    HTMLDivElement,
    HTMLElement,
    HTMLHeadingElement,
    HTMLImageElement,
  }
}
