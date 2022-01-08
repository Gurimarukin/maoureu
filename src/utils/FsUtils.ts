import type { PathLike } from 'fs'
import type { FileHandle } from 'fs/promises'
import fs from 'fs/promises'
import type { Stream } from 'stream'

import { Future } from './fp'

const writeFile = (
  file: PathLike | FileHandle,
  data:
    | string
    | NodeJS.ArrayBufferView
    | Iterable<string | NodeJS.ArrayBufferView>
    | AsyncIterable<string | NodeJS.ArrayBufferView>
    | Stream,
): Future<void> => Future.tryCatch(() => fs.writeFile(file, data))

export const FsUtils = { writeFile }
