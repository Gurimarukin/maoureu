import { pipe } from 'fp-ts/function'

import type { Dir } from '../models/FileOrDir'
import { Post } from '../models/Post'
import { JsonUtils } from '../utils/JsonUtils'
import type { Future } from '../utils/fp'
import { getDescriptionFile } from './getDescriptionFile'

export const parsePostFromDir = (postDir: Dir): Future<Post> =>
  pipe(getDescriptionFile(postDir), JsonUtils.parseFile([Post.codec, 'Post']))
