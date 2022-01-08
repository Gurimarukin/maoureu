import { task } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import got, { HTTPError } from 'got'

import { config } from '../config'
import { Dir } from '../models/FileOrDir'
import { FsUtils } from './FsUtils'
import { StringUtils } from './StringUtils'
import { Either, Future, Maybe } from './fp'

const getText = (url: string): Future<string> => {
  const cleanedUrl = StringUtils.cleanFileName(url)
  const cachedFile = pipe(config.output.cache.dir, Dir.joinFile(`${cleanedUrl}.html`))
  return pipe(
    FsUtils.exists(cachedFile),
    Future.chain(exists =>
      exists
        ? FsUtils.readFile(cachedFile)
        : pipe(
            Future.tryCatch(() => got.get(url)),
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
            Future.map(res => res.body),
            Future.chainFirst(() => FsUtils.mkdir(config.output.cache.dir, { recursive: true })),
            Future.chainFirst(body => FsUtils.writeFile(cachedFile, body)),
          ),
    ),
  )
}

export const GotUtils = { getText }
