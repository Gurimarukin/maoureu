/* eslint-disable functional/no-expression-statement, functional/no-return-void */
import { pipe } from 'fp-ts/function'
import React, { Fragment } from 'react'

import { config } from '../config'
import { DomHandler } from '../helpers/DomHandler'
import { Dir, File } from '../models/FileOrDir'
import type { Post, PostImage } from '../models/Post'
import { PostId } from '../models/PostId'
import type { List } from '../utils/fp'
import { NonEmptyArray } from '../utils/fp'

type MaoureuAppProps = {
  readonly posts: List<Post>
}

export const MaoureuApp = ({ posts }: MaoureuAppProps): JSX.Element => (
  <div className="w-screen h-screen overflow-auto bg-gray-600">
    <div className="w-[29.7cm] h-[21cm] flex flex-col justify-center items-center text-white">
      <a href="https://maour.eu" target="_blank" rel="noreferrer">
        <img src={getImgSrc('maoureuses-logo-web.png')} />
      </a>
      <p className="mt-8">
        📚 BD ⋅ 💞 (poly)amour, genre, sexualité ⋅ 😺 Chamille ⋅ ✏️ Nouvelle chronique chaque
        mercredi
      </p>
    </div>
    {posts.map(post => {
      const key = PostId.unwrap(post.id)

      if (post.id === config.maoureu.tikvaWolfPostId) return <VerticalPost key={key} post={post} />

      const { images, ...withoutImages } = post
      const [head, tail] = pipe(
        images,
        NonEmptyArray.chunksOf(config.maoureu.imagesPerPage),
        NonEmptyArray.unprepend,
      )
      return (
        <Fragment key={key}>
          <PostComponent post={withoutImages} images={head} />
          {tail.map(imgs => (
            <Page key={NonEmptyArray.head(imgs).fileName} postId={post.id} images={imgs} />
          ))}
        </Fragment>
      )
    })}
  </div>
)

type PostProps = {
  readonly post: Omit<Post, 'images'>
  readonly images: Post['images']
}

const PostComponent = ({ post, images }: PostProps): JSX.Element => (
  <Page postId={post.id} images={images}>
    <div className="grow-0 flex items-start">
      <a href={post.link} target="_blank" rel="noreferrer" className="grow-0 shrink-0">
        <h1 className="text-3xl font-bold">{post.title}</h1>
      </a>
      <p className="grow-0 shrink-0 mx-8 mt-2 text-center text-sm text-gray-400">{post.date}</p>
      <p
        dangerouslySetInnerHTML={{ __html: getDescription(post.paragraphs) }}
        className="grow pt-[7px] pb-3 text-right italic font-normal whitespace-pre-wrap leading-[1] post-paragraph"
      />
    </div>
  </Page>
)

const getDescription = (paragraphs: NonEmptyArray<string>): string => {
  const domHandler = DomHandler.of(NonEmptyArray.head(paragraphs))
  domHandler.document.body.querySelectorAll('a').forEach(a => {
    /* eslint-disable functional/immutable-data */
    a.target = '_blank'
    a.rel = 'noreferrer'
    /* eslint-enable functional/immutable-data */
  })
  return domHandler.document.body.innerHTML
}

type PageProps = {
  readonly postId: PostId
  readonly images: NonEmptyArray<PostImage>
}

const Page: React.FC<PageProps> = ({ postId, images, children }) => (
  <div
    className="w-[29.7cm] h-[21cm] p-6 flex flex-col justify-between bg-gray-50"
    style={{ borderTop: pageSeparator }}
  >
    {children}
    <div
      className={`grow self-center w-[1010px] flex flex-wrap ${
        images.length <= config.maoureu.justifyCenterLimit ? 'justify-center' : 'justify-start'
      } content-center items-start gap-4`}
    >
      {images.map(img => (
        <div key={img.fileName} className="w-[326px] border border-black rounded overflow-hidden">
          <img src={getPostImgSrc(postId, img.fileName, 1024)} />
        </div>
      ))}
    </div>
  </div>
)

type VerticalPostProps = {
  readonly post: Post
}

const VerticalPost = ({ post }: VerticalPostProps): JSX.Element => {
  const image = NonEmptyArray.head(post.images)
  return (
    <div className="w-[29.7cm] h-[21cm] flex justify-center items-center rotate-[-90deg]">
      <div
        className={`w-[21cm] h-[29.7cm] flex flex-col p-6 bg-gray-50`}
        style={{ borderRight: pageSeparator }}
      >
        <div className="grow-0 flex items-start">
          <a href={post.link} target="_blank" rel="noreferrer">
            <h1 className="text-3xl font-bold">{post.title}</h1>
          </a>
          <p className="shrink-0 mx-8 mt-2 text-center text-sm text-gray-400">{post.date}</p>
        </div>
        <p
          dangerouslySetInnerHTML={{ __html: getDescription(post.paragraphs) }}
          className="grow-0 pt-[7px] pb-3 text-right italic font-normal whitespace-pre-wrap leading-[1] post-paragraph"
        />
        <div className="grow flex justify-center">
          <div className="border border-black rounded overflow-hidden">
            <img src={getPostImgSrc(post.id, image.fileName)} className="h-[917px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

// const pageSeparator = '1px solid black'
const pageSeparator = 'none'

const getImgSrc = (fileName: string): string =>
  pipe(
    File.dir(config.output.maoureu.indexHtml),
    Dir.relative(pipe(config.maoureu.webapp.images.dir, Dir.joinFile(fileName))),
  ).path

const getPostImgSrc = (postId: PostId, fileName: string, width?: number): string =>
  `${
    pipe(
      File.dir(config.output.maoureu.indexHtml),
      Dir.relative(
        pipe(config.output.maoureu.posts.dir, Dir.joinFile(PostId.unwrap(postId), fileName)),
      ),
    ).path
  }${width === undefined ? '' : `?width=${width}`}`
