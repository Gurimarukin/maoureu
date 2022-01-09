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
  <div>
    {posts.map(post => (
      <PostComp key={PostId.unwrap(post.id)} post={post} />
    ))}
  </div>
)

type PostProps = {
  readonly post: Post
}

const PostComp = ({ post }: PostProps): JSX.Element => {
  const [head, tail] = NonEmptyArray.unprepend(post.paragraphs)
  return (
    <div>
      <h1>{post.title}</h1>
      <p>{head}</p>
      {post.images.map(img => (
        <img key={img.fileName} src={getImgSrc(post.id, img)} />
      ))}
      {tail.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  )
}

const getImgSrc = (postId: PostId, { fileName }: PostImage): string =>
  path.relative(
    config.output.maoureu.indexHtml.dirname,
    pipe(config.output.maoureu.posts.dir, Dir.joinFile(PostId.unwrap(postId), fileName)).path,
  )
