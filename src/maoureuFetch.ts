import { apply, predicate } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { HTTPError } from 'got/dist/source'
import path from 'path'

import { config } from './config'
import { getDescriptionFile } from './helpers/getDescriptionFile'
import { parsePostFromDir } from './helpers/parsePostFromDir'
import { postLinksFromBlogPage } from './helpers/postLinksFromBlogPage'
import type { File } from './models/FileOrDir'
import { Dir, FileOrDir } from './models/FileOrDir'
import type { PostImage } from './models/Post'
import { Post } from './models/Post'
import { PostId } from './models/PostId'
import { Validation } from './models/Validation'
import { FsUtils } from './utils/FsUtils'
import { HttpUtils } from './utils/HttpUtils'
import { JsonUtils } from './utils/JsonUtils'
import { StringUtils } from './utils/StringUtils'
import { Either, Future, List, Maybe, NonEmptyArray, Tuple } from './utils/fp'

const main = (): Future<void> =>
  pipe(
    Future.Do,
    Future.apS('postLinks', fetchPostLinks()),
    Future.apS('existingPosts', getExistingPosts()),
    Future.map(({ postLinks, existingPosts }) => filteredPostLinks(postLinks, existingPosts)),
    Future.chain(fetchAndWritePosts),
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
    HttpUtils.getText(config.maoureu.urls.page(page)),
    Future.chain(pageHtml => fetchPageHtmlsRec([...acc, pageHtml], page + 1)),
    Future.orElse(e => {
      if (e instanceof HTTPError && e.response.statusCode === 404) {
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

const filteredPostLinks = (
  postLinks: List<string>,
  existingPosts: List<PostId>,
): List<Tuple<string, PostId>> =>
  pipe(
    postLinks,
    List.filterMap(url =>
      pipe(
        PostId.fromUrl(url),
        Maybe.filter(predicate.not(id => pipe(existingPosts, List.elem(PostId.Eq)(id)))),
        Maybe.map(postId => Tuple.of(url, postId)),
      ),
    ),
  )

const fetchAndWritePosts = (postLinks: List<Tuple<string, PostId>>): Future<void> =>
  pipe(
    postLinks,
    Future.traverseSeqArray(([url, postId]) => {
      const postDir = pipe(config.output.maoureu.posts.dir, Dir.joinDir(PostId.unwrap(postId)))
      return pipe(
        FsUtils.exists(postDir),
        Future.chain(exists =>
          exists
            ? validateExistingPost(postDir)
            : pipe(fetchPost(url, postId), Future.chain(writePost(postDir))),
        ),
      )
    }),
    Future.map<List<void>, void>(() => undefined),
  )

const validateExistingPost = (postDir: Dir): Future<void> =>
  pipe(
    parsePostFromDir(postDir),
    Future.chain(post =>
      pipe(
        post.images,
        Future.traverseArray(image =>
          pipe(
            FsUtils.exists(getImageFile(postDir, image)),
            Future.map(exists =>
              exists
                ? Maybe.none
                : Maybe.some(`Missing expected image: ${image.fileName} - ${image.url}`),
            ),
          ),
        ),
      ),
    ),
    Future.map(List.compact),
    Future.map(NonEmptyArray.fromReadonlyArray),
    Future.chain(
      Maybe.fold(
        () => Future.unit, // no errors
        flow(StringUtils.mkString('\n'), Error, Future.left),
      ),
    ),
    // Future.map<List<void>, void>(() => undefined),
  )

const fetchPost = (url: string, postId: PostId): Future<Post> =>
  pipe(
    HttpUtils.getText(url),
    Future.chain(postHtml =>
      pipe(
        Post.fromBlogPost({ html: postHtml, link: url, id: postId }),
        Validation.toTry,
        Either.mapLeft(e => Error(`${url}\n${e.stack}`)),
        Future.fromEither,
      ),
    ),
  )

const writePost =
  (postDir: Dir) =>
  (post: Post): Future<void> =>
    pipe(
      FsUtils.mkdir(postDir, { recursive: true }),
      Future.chain(() =>
        pipe(
          post.images,
          Future.traverseSeqArray(image =>
            pipe(
              HttpUtils.getBuffer(image.url),
              Future.chain(buffer => FsUtils.writeFile(getImageFile(postDir, image), buffer)),
            ),
          ),
        ),
      ),
      Future.chain(() =>
        FsUtils.writeFile(
          getDescriptionFile(postDir),
          JsonUtils.stringify(Post.codec, { pretty: true })(post),
        ),
      ),
    )

const getImageFile = (postDir: Dir, image: PostImage): File =>
  pipe(postDir, Dir.joinFile(image.fileName))

// eslint-disable-next-line functional/no-expression-statement
Future.runUnsafe(main())
