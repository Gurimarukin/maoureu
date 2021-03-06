import { random } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import type { NonEmptyArray, Tuple } from './fp'
import { List, Maybe } from './fp'

const margin = /^\s*\|/gm
const stripMargins = (str: string): string => str.replace(margin, '')

const ellipse =
  (take: number) =>
  (str: string): string =>
    take < str.length && 3 <= take ? `${str.slice(0, take - 3)}...` : str

const isEmpty = (str: string): boolean => str === ''

const isString = (u: unknown): u is string => typeof u === 'string'

const matcher =
  <A>(regex: RegExp, f: (arr: RegExpMatchArray) => A) =>
  (str: string): Maybe<A> =>
    pipe(str.match(regex), Maybe.fromNullable, Maybe.map(f))

const matcher1 = (regex: RegExp): ((str: string) => Maybe<string>) =>
  matcher(regex, ([, a]) => a as string)

const matcher2 = (regex: RegExp): ((str: string) => Maybe<Tuple<string, string>>) =>
  matcher(regex, ([, a, b]) => [a, b] as Tuple<string, string>)

function mkString(sep: string): (list: List<string>) => string
function mkString(start: string, sep: string, end: string): (list: List<string>) => string
function mkString(startOrSep: string, sep?: string, end?: string): (list: List<string>) => string {
  return list =>
    sep !== undefined && end !== undefined
      ? `${startOrSep}${list.join(sep)}${end}`
      : list.join(startOrSep)
}

const pad10 = (n: number): string => (n < 10 ? `0${n}` : `${n}`)

const pad100 = (n: number): string => (n < 10 ? `00${n}` : n < 100 ? `0${n}` : `${n}`)

const isUnicodeLetter = (c: string): boolean => c.toLowerCase() !== c.toUpperCase()
const isUpperCase = (c: string): boolean => c.toUpperCase() === c
const isLowerCase = (c: string): boolean => c.toLowerCase() === c

const upperOrLower: NonEmptyArray<(c: string) => string> = [
  c => c.toUpperCase(),
  c => c.toLowerCase(),
]
const randomCaseChar = (c: string): string => random.randomElem(upperOrLower)()(c)

const randomCase = (str: string): string =>
  pipe(
    str.split(''),
    List.reduce('', (acc, c) => {
      if (!isUnicodeLetter(c)) return acc + c

      if (acc.length < 2) return acc + randomCaseChar(c)

      const a = acc.charAt(acc.length - 2)
      const b = acc.charAt(acc.length - 1)

      if (!isUnicodeLetter(a) || !isUnicodeLetter(b)) return acc + randomCaseChar(c)

      if (isUpperCase(a) && isUpperCase(b)) return acc + c.toLowerCase()
      if (isLowerCase(a) && isLowerCase(b)) return acc + c.toUpperCase()

      return acc + randomCaseChar(c)
    }),
  )

const fileNameForbiddenChars = /[<>:"/\?\*\|\\]/g
const cleanFileName = (str: string): string => str.replace(fileNameForbiddenChars, '')

const whitespaces = /\s+/g
const cleanWhitespaces = (str: string): string => str.replace(whitespaces, ' ')

const weirdCharSometimesReturnedByBandcamp = new RegExp(`${String.fromCharCode(8203)}+`, 'g')
const cleanHtml = (str: string): string =>
  cleanWhitespaces(
    str
      // newline please
      .trim()
      .replace(weirdCharSometimesReturnedByBandcamp, '')
      .normalize(),
  )

export const StringUtils = {
  ellipse,
  isEmpty,
  isString,
  matcher1,
  matcher2,
  mkString,
  pad10,
  pad100,
  randomCase,
  stripMargins,

  cleanFileName,
  cleanWhitespaces,
  cleanHtml,
}
