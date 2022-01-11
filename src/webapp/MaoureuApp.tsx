import { pipe } from 'fp-ts/function'
import React, { Fragment } from 'react'

import { config } from '../config'
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
    <div className="w-[29.7cm] h-[21cm] flex flex-col justify-center items-center border-green-500 text-white">
      <a href="https://maour.eu" target="_blank" rel="noreferrer">
        <img src={getImgSrc('maoureuses-logo-web.png')} />
      </a>
      <p className="mt-8">
        📚 BD ⋅ 💞 (poly)amour, genre, sexualité ⋅ 😺 Chamille ⋅ ✏️ Nouvelle chronique chaque
        mercredi
      </p>
    </div>
    {posts.map(({ images, ...post }) => {
      const [head, tail] = pipe(
        images,
        NonEmptyArray.chunksOf(config.maoureu.imagesPerPage),
        NonEmptyArray.unprepend,
      )
      return (
        <Fragment key={PostId.unwrap(post.id)}>
          <PostComp post={post} images={head} />
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

const PostComp = ({ post, images }: PostProps): JSX.Element => (
  <Page postId={post.id} images={images}>
    <div className="flex">
      <a href={post.link} target="_blank" rel="noreferrer" className="grow-0 shrink-0">
        <h1 className="text-3xl text-center font-bold">{post.title}</h1>
      </a>
      <p className="grow-0 shrink-0 mx-8 mt-2 text-center text-sm text-gray-400">{post.date}</p>
      <p className="grow text-right italic font-normal whitespace-pre-wrap">
        {NonEmptyArray.head(post.paragraphs)}
      </p>
    </div>
  </Page>
)

type PageProps = {
  readonly postId: PostId
  readonly images: NonEmptyArray<PostImage>
}

const Page: React.FC<PageProps> = ({ postId, images, children }) => (
  <div className="w-[29.7cm] h-[21cm] p-6 bg-gray-50 border border-green-500">
    {children}
    <div className="mt-2 grid grid-cols-3 gap-4">
      {images.map(img => (
        <div key={img.fileName} className="border border-black rounded overflow-hidden">
          <img src={getPostImgSrc(postId, img)} />
        </div>
      ))}
    </div>
  </div>
)

const getImgSrc = (fileName: string): string =>
  pipe(
    File.dir(config.output.maoureu.indexHtml),
    Dir.relative(pipe(config.maoureu.webapp.images.dir, Dir.joinFile(fileName))),
  ).path

const getPostImgSrc = (postId: PostId, { fileName }: PostImage): string =>
  pipe(
    File.dir(config.output.maoureu.indexHtml),
    Dir.relative(
      pipe(config.output.maoureu.posts.dir, Dir.joinFile(PostId.unwrap(postId), fileName)),
    ),
  ).path
