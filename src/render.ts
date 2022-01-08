import { apply } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'

import { postLinksFromBlogPage } from './helpers/postLinksFromBlogPage'
import { Validation } from './models/Validation'
import { FsUtils } from './utils/FsUtils'
import { GotUtils } from './utils/GotUtils'
import { StringUtils } from './utils/StringUtils'
import { Either, List, Maybe, NonEmptyArray } from './utils/fp'
import { Future } from './utils/fp'

const main = (): Future<void> =>
  pipe(
    fetchPosts(),
    Future.chain(res => FsUtils.writeFile('output/toto.json', JSON.stringify(res))),
  )

const fetchPosts = (): Future<unknown> => fetchPostLinks()

const fetchPostLinks = (): Future<List<string>> =>
  pipe(
    fetchPageHtmlsRec(List.empty, 1),
    Future.chain(
      flow(
        NonEmptyArray.fromReadonlyArray,
        Maybe.fold(
          () => Future.right(List.empty),
          nea => {
            const [head, tail] = pipe(
              nea,
              NonEmptyArray.mapWithIndex((i, pageHtml) =>
                pipe(
                  postLinksFromBlogPage(pageHtml),
                  Either.mapLeft(NonEmptyArray.map(s => `page ${i + 1}: ${s}`)),
                ),
              ),
              NonEmptyArray.unprepend,
            )
            return pipe(
              apply.sequenceT(Validation.validation)(head, ...tail),
              Validation.toTry,
              Either.map(List.flatten),
              Future.fromEither,
            )
          },
        ),
      ),
    ),
  )

const fetchPageHtmlsRec = (acc: List<string>, page: number): Future<List<string>> =>
  pipe(
    GotUtils.getText(`https://maour.eu/page/${page}`),
    Future.chain(pageHtml => fetchPageHtmlsRec([...acc, pageHtml], page + 1)),
    Future.orElse(e => {
      console.log(
        StringUtils.stripMargins(
          `Stop fetching pages recursively - page ${page}
          |Error: ${e.message}`,
        ),
      )
      return Future.right(acc)
    }),
  )

// eslint-disable-next-line functional/no-expression-statement
Future.runUnsafe(main())
