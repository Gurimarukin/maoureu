import { pipe } from 'fp-ts/function'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

import { config } from './config'
import { indexHtml } from './helpers/indexHtml'
import { Post } from './models/Post'
import { FsUtils } from './utils/FsUtils'
import { JsonUtils } from './utils/JsonUtils'
import { List } from './utils/fp'
import { Future, Tuple } from './utils/fp'
import { MaoureuApp } from './webapp/MaoureuApp'

const main = (): Future<void> => pipe(getPosts(), Future.chain(writeHtml))

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
      resetCss: config.maoureu.indexHtmlArgs.resetCss,
      content: ReactDOMServer.renderToStaticMarkup(<MaoureuApp posts={posts} />),
    }),
  )

// eslint-disable-next-line functional/no-expression-statement
Future.runUnsafe(main())
