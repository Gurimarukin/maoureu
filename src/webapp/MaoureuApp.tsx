import { pipe } from 'fp-ts/function'
import path from 'path'
import React from 'react'

import { config } from '../config'
import { Dir } from '../models/FileOrDir'
import type { Post, PostImage } from '../models/Post'
import { PostId } from '../models/PostId'
import type { List } from '../utils/fp'
import { NonEmptyArray } from '../utils/fp'

type MaoureuAppProps = {
  readonly posts: List<Post>
}

export const MaoureuApp = ({ posts }: MaoureuAppProps): JSX.Element => (
  <div className="bg-gray-600">
    {posts.map(post => (
      <PostComp key={PostId.unwrap(post.id)} post={post} />
    ))}
  </div>
)

type PostProps = {
  readonly post: Post
}

const PostComp = ({ post }: PostProps): JSX.Element => {
  const [head /* , tail */] = NonEmptyArray.unprepend(post.paragraphs)
  return (
    <div className="w-[21cm] h-[29.7cm] p-6 bg-gray-50 border border-green-500">
      <p className="text-center text-sm text-gray-400">{post.date}</p>
      <a href={post.link} target="_blank" rel="noreferrer">
        <h1 className="text-3xl text-center font-bold">{post.title}</h1>
      </a>
      <p className="mt-2 italic font-normal">{head}</p>
      <div className="mt-2 grid grid-cols-2 gap-4">
        {post.images.map(img => (
          <div key={img.fileName} className="border border-black rounded overflow-hidden">
            <img src={getImgSrc(post.id, img)} />
          </div>
        ))}
      </div>
      {/* {tail.map((p, i) => (
        <p key={i}>{p}</p>
      ))} */}
    </div>
  )
}

const getImgSrc = (postId: PostId, { fileName }: PostImage): string =>
  path.relative(
    config.output.maoureu.indexHtml.dirname,
    pipe(config.output.maoureu.posts.dir, Dir.joinFile(PostId.unwrap(postId), fileName)).path,
  )
