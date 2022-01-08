import { apply, predicate } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { JSDOM } from 'jsdom'

import { Validation } from '../models/Validation'
import { StringUtils } from '../utils/StringUtils'
import { Either, NonEmptyArray } from '../utils/fp'

export type Constructor<E> = {
  new (): E
  readonly prototype: E
}

export type DomHandler = ReturnType<typeof DomHandler>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const DomHandler = (html: string) => {
  const jsdom = new JSDOM(html)

  function querySelectorEnsureOne(selector: string): (parent: ParentNode) => Either<string, Element>
  function querySelectorEnsureOne<E extends Element>(
    selector: string,
    type: Constructor<E>,
  ): (parent: ParentNode) => Either<string, E>
  function querySelectorEnsureOne<E extends Element>(selector: string, type?: Constructor<E>) {
    return (parent: ParentNode): Either<string, Element | E> => {
      const res = parent.querySelectorAll(selector)
      const elt = res[0]

      if (elt === undefined) return Either.left(`No element matches selector: ${selector}`)
      if (1 < res.length) return Either.left(`More than one element matches selector: ${selector}`)

      if (type === undefined) return Either.right(elt)

      const isE = (e: Element): e is E => e instanceof type
      if (isE(elt)) return Either.right(elt)

      return Either.left(`Element don't have expected type: ${type.name}`)
    }
  }

  function querySelectorAllNonEmpty(
    selector: string,
  ): (parent: ParentNode) => Validation<NonEmptyArray<Element>>
  function querySelectorAllNonEmpty<E extends Element>(
    selector: string,
    type: Constructor<E>,
  ): (parent: ParentNode) => Validation<NonEmptyArray<E>>
  function querySelectorAllNonEmpty<E extends Element>(
    selector: string,
    type?: Constructor<E>,
  ): (parent: ParentNode) => Validation<NonEmptyArray<E>> {
    return (parent: ParentNode): Validation<NonEmptyArray<E>> => {
      const elts = parent.querySelectorAll(selector)

      const res = pipe(
        NonEmptyArray.fromReadonlyArray([...elts]),
        Either.fromOption(() => NonEmptyArray.of(`No element matches selector: ${selector}`)),
      )

      if (type === undefined) return res as Validation<NonEmptyArray<E>>

      const isE = (e: Element): e is E => e instanceof type
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
      querySelectorEnsureOne(selector, jsdom.window.HTMLElement),
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

  return {
    document: jsdom.window.document,
    querySelectorEnsureOne,
    querySelectorAllNonEmpty,
    parseText,

    HTMLAnchorElement: jsdom.window.HTMLAnchorElement,
  }
}

const looksLikeHTMLTag = (str: string): boolean => str.startsWith('<') && str.endsWith('/>')
