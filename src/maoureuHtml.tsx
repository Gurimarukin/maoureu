import { ord, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

import { config } from './config'
import { indexHtml } from './helpers/indexHtml'
import { Post } from './models/Post'
import { PostId } from './models/PostId'
import { FsUtils } from './utils/FsUtils'
import { JsonUtils } from './utils/JsonUtils'
import { List } from './utils/fp'
import { Future, Tuple } from './utils/fp'
import { MaoureuApp } from './webapp/MaoureuApp'

const ordPostById: Ord<Post> = pipe(
  string.Ord,
  ord.contramap(({ id }) => PostId.unwrap(id)),
)

const main = (): Future<void> =>
  pipe(getPosts(), Future.map(List.sort(ordPostById)), Future.chain(writeHtml))

const getPosts = (): Future<List<Post>> =>
  pipe(
    config.output.maoureu.postsJson,
    JsonUtils.parseFile(Tuple.of(List.decoder(Post.codec), 'List<Post>')),
  )

const writeHtml = (posts: List<Post>): Future<void> =>
  FsUtils.writeFile(
    config.output.maoureu.indexHtml,
    indexHtml({
      title: config.maoureu.indexHtmlArgs.title,
      appCss: config.maoureu.indexHtmlArgs.appCss,
      content: ReactDOMServer.renderToStaticMarkup(<MaoureuApp posts={posts} />),
    }),
  )

// eslint-disable-next-line functional/no-expression-statement
Future.runUnsafe(main())
