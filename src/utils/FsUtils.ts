import { pipe } from 'fp-ts/function'
import fs from 'fs'
import type { Stream } from 'stream'

import { FileOrDir } from '../models/FileOrDir'
import type { Dir, File } from '../models/FileOrDir'
import { Future, List, Maybe } from './fp'

const exists = (f: FileOrDir): Future<boolean> => pipe(stat(f), Future.map(Maybe.isSome))

const mkdir = (dir: Dir, options?: fs.MakeDirectoryOptions): Future<void> =>
  pipe(
    Future.tryCatch(() => fs.promises.mkdir(dir.path, options)),
    Future.map(() => undefined),
  )

const readdir = (dir: Dir): Future<List<FileOrDir>> =>
  pipe(
    Future.tryCatch(() => fs.promises.readdir(dir.path, { withFileTypes: true })),
    Future.map(List.map(FileOrDir.fromDirent(dir))),
  )

const readFile = (file: File): Future<string> =>
  Future.tryCatch(() => fs.promises.readFile(file.path, { encoding: 'utf-8' }))

const stat = (f: FileOrDir): Future<Maybe<fs.Stats>> =>
  pipe(
    Future.tryCatch(() => fs.promises.stat(f.path)),
    Future.map(Maybe.some),
    Future.orElse(() => Future.right<Maybe<fs.Stats>>(Maybe.none)),
  )

const writeFile = (
  file: File,
  data:
    | string
    | NodeJS.ArrayBufferView
    | Iterable<string | NodeJS.ArrayBufferView>
    | AsyncIterable<string | NodeJS.ArrayBufferView>
    | Stream,
): Future<void> => Future.tryCatch(() => fs.promises.writeFile(file.path, data))

export const FsUtils = {
  exists,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
}
