import { json } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import type { Dir } from '../models/FileOrDir'
import { Post } from '../models/Post'
import { FsUtils } from '../utils/FsUtils'
import { Either, Future } from '../utils/fp'
import { decodeError } from '../utils/ioTsUtils'
import { unknownToError } from '../utils/unknownToError'
import { getDescriptionFile } from './getDescriptionFile'

export const parsePostFromDir = (postDir: Dir): Future<Post> =>
  pipe(
    FsUtils.readFile(getDescriptionFile(postDir)),
    Future.map(json.parse),
    Future.map(Either.mapLeft(unknownToError)),
    Future.chain(Future.fromEither),
    Future.map(u => pipe(Post.codec.decode(u), Either.mapLeft(decodeError('Post')(u)))),
    Future.chain(Future.fromEither),
  )
