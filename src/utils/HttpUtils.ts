import { task } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { OptionsOfTextResponseBody, OptionsOfUnknownResponseBody, Response } from 'got'
import got, { HTTPError } from 'got'

import { config } from '../config'
import { Dir } from '../models/FileOrDir'
import { FsUtils } from './FsUtils'
import { StringUtils } from './StringUtils'
import { Either, Future, Maybe } from './fp'

type GetTextOpts = {
  readonly cached: boolean
}

const getText = (url: string, { cached }: GetTextOpts): Future<string> => {
  const cleanedUrl = StringUtils.cleanFileName(url)
  const cachedFile = pipe(config.output.cache.dir, Dir.joinFile(`${cleanedUrl}.html`))

  const fetch = pipe(
    getWithConsoleDebug(url),
    Future.map(res => res.body),
  )

  if (cached) {
    return pipe(
      FsUtils.exists(cachedFile),
      Future.chain(exists =>
        exists
          ? FsUtils.readFile(cachedFile)
          : pipe(
              fetch,
              Future.chainFirst(() => FsUtils.mkdir(config.output.cache.dir, { recursive: true })),
              Future.chainFirst(body => FsUtils.writeFile(cachedFile, body)),
            ),
      ),
    )
  }

  return fetch
}

const getBuffer = (url: string): Future<Buffer> =>
  pipe(
    getWithConsoleDebug(url, { responseType: 'buffer' }),
    Future.map(res => res.rawBody),
  )

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

export const HttpUtils = { getText, getBuffer }
