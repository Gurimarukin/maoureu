import { task } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { OptionsOfTextResponseBody, OptionsOfUnknownResponseBody, Response } from 'got'
import got, { HTTPError } from 'got'

import { config } from '../config'
import type { File } from '../models/FileOrDir'
import { Dir } from '../models/FileOrDir'
import { FsUtils } from './FsUtils'
import { StringUtils } from './StringUtils'
import { Either, Future, Maybe } from './fp'

type Cached = {
  readonly cached: boolean
}

const getText = (url: string, { cached }: Cached): Future<string> => {
  const fetch = pipe(
    getWithConsoleDebug(url),
    Future.map(res => res.body),
  )
  return cached ? withCache(FsUtils.readFileString)(url, fetch) : fetch
}

const getBuffer = (url: string, { cached }: Cached): Future<Buffer> => {
  const fetch = pipe(
    getWithConsoleDebug(url, { responseType: 'buffer' }),
    Future.map(res => res.rawBody),
  )
  return cached ? withCache(FsUtils.readFileBuffer)(url, fetch) : fetch
}

function getWithConsoleDebug(
  url: string,
  options?: OptionsOfTextResponseBody,
): Future<Response<string>>
function getWithConsoleDebug(url: string, options?: OptionsOfUnknownResponseBody): Future<Response>
function getWithConsoleDebug(
  url: string,
  options?: OptionsOfTextResponseBody | OptionsOfUnknownResponseBody,
): Future<Response> {
  return pipe(
    Future.tryCatch(() => got.get(url, options)),
    task.map(either => {
      const statusCode = pipe(
        either,
        Either.fold(
          e => (e instanceof HTTPError ? Maybe.some(e.response.statusCode) : Maybe.none),
          res => Maybe.some(res.statusCode),
        ),
      )
      if (Maybe.isSome(statusCode)) console.debug(`GET ${url} ${statusCode.value}`)
      return either
    }),
  )
}

function withCache(
  readFile: (f: File) => Future<string>,
): (key: string, fetch: Future<string>) => Future<string>
function withCache(
  readFile: (f: File) => Future<Buffer>,
): (key: string, fetch: Future<Buffer>) => Future<Buffer>
function withCache<A extends string | Buffer>(
  readFile: (f: File) => Future<A>,
): (key: string, fetch: Future<A>) => Future<A> {
  return (key, fetch) => {
    const cleanedUrl = StringUtils.cleanFileName(key)
    const cachedFile = pipe(config.output.cache.dir, Dir.joinFile(cleanedUrl))
    return pipe(
      FsUtils.exists(cachedFile),
      Future.chain(exists =>
        exists
          ? readFile(cachedFile)
          : pipe(
              fetch,
              Future.chainFirst(() => FsUtils.mkdir(config.output.cache.dir, { recursive: true })),
              Future.chainFirst(body => FsUtils.writeFile(cachedFile, body)),
            ),
      ),
    )
  }
}

export const HttpUtils = { getText, getBuffer }
