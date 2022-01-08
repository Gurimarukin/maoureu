import { apply, predicate } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { HTTPError } from 'got/dist/source'
import path from 'path'

import { config } from './config'
import { postLinksFromBlogPage } from './helpers/postLinksFromBlogPage'
import { Dir, FileOrDir } from './models/FileOrDir'
import { Post } from './models/Post'
import { PostId } from './models/PostId'
import { Validation } from './models/Validation'
import { FsUtils } from './utils/FsUtils'
import { GotUtils } from './utils/GotUtils'
import { Either, List, Maybe, NonEmptyArray, inspect } from './utils/fp'
import { Future } from './utils/fp'

const main = (): Future<void> =>
  pipe(
    fetchPosts(),
    Future.map(inspect('res:')),
    Future.chain(res =>
      FsUtils.writeFile(
        pipe(config.output.maoureu.dir, Dir.joinFile('toto.json')),
        JSON.stringify(res),
      ),
    ),
  )

const fetchPosts = (): Future<unknown> =>
  pipe(
    Future.Do,
    Future.apS('postLinks', fetchPostLinks()),
    Future.apS('existingPosts', getExistingPosts()),
    Future.chain(({ postLinks, existingPosts }) =>
      pipe(
        postLinks,
        Future.traverseArray(url =>
          pipe(
            PostId.fromUrl(url),
            Maybe.filter(predicate.not(id => pipe(existingPosts, List.elem(PostId.Eq)(id)))),
            Maybe.fold(
              () => Future.right(Maybe.none),
              postId => pipe(fetchPost(url, postId), Future.map(Maybe.some)),
            ),
          ),
        ),
      ),
    ),
    Future.map(List.compact),
  )

const fetchPostLinks = (): Future<List<string>> =>
  pipe(
    fetchPageHtmlsRec(List.empty, 1),
    Future.chain(
      flow(
        NonEmptyArray.fromReadonlyArray,
        Maybe.fold(
          () => Future.right(List.empty),
          flow(
            NonEmptyArray.mapWithIndex((i, pageHtml) =>
              pipe(
                postLinksFromBlogPage(pageHtml),
                Either.mapLeft(NonEmptyArray.map(s => `page ${i + 1}: ${s}`)),
              ),
            ),
            ([head, ...tail]) => apply.sequenceT(Validation.validation)(head, ...tail),
            Validation.toTry,
            Either.map(List.flatten),
            Future.fromEither,
          ),
        ),
      ),
    ),
  )

const fetchPageHtmlsRec = (acc: List<string>, page: number): Future<List<string>> =>
  pipe(
    GotUtils.getText(config.maoureu.page(page)),
    Future.chain(pageHtml => fetchPageHtmlsRec([...acc, pageHtml], page + 1)),
    Future.orElse(e => {
      if (e instanceof HTTPError) {
        console.debug(`Fetched ${page - 1} pages`)
        return Future.right(acc)
      }
      return Future.left(e)
    }),
  )

const getExistingPosts = (): Future<List<PostId>> =>
  pipe(
    FsUtils.mkdir(config.output.maoureu.posts.dir, { recursive: true }),
    Future.chain(() => FsUtils.readdir(config.output.maoureu.posts.dir)),
    Future.map(
      flow(
        List.filter(FileOrDir.isDir),
        List.map(d => PostId.wrap(path.basename(d.path))),
      ),
    ),
  )

const fetchPost = (url: string, postId: PostId): Future<Post> =>
  pipe(
    GotUtils.getText(url),
    Future.chain(postHtml =>
      pipe(
        Post.fromBlogPost({ html: postHtml, link: url, id: postId }),
        Validation.toTry,
        Either.mapLeft(e => Error(`${url}\n${e.message}`)),
        Future.fromEither,
      ),
    ),
  )

// eslint-disable-next-line functional/no-expression-statement
Future.runUnsafe(main())
