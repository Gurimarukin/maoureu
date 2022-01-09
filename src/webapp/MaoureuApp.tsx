import React from 'react'

import type { Post } from '../models/Post'
import type { List } from '../utils/fp'

type Props = {
  readonly posts: List<Post>
}

export const MaoureuApp = ({ posts }: Props): JSX.Element => (
  <pre>{JSON.stringify(posts, null, 2)}</pre>
)
