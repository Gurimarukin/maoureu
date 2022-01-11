import { pipe } from 'fp-ts/function'
import fs from 'fs'
import rimraf from 'rimraf'
import type { Stream } from 'stream'

import { FileOrDir } from '../models/FileOrDir'
import type { Dir, File } from '../models/FileOrDir'
import { Future, List, Maybe } from './fp'

export type FileWritable =
  | string
  | NodeJS.ArrayBufferView
  | Iterable<string | NodeJS.ArrayBufferView>
  | AsyncIterable<string | NodeJS.ArrayBufferView>
  | Stream

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

const readFileBuffer = (file: File): Future<Buffer> =>
  Future.tryCatch(() => fs.promises.readFile(file.path))

const readFileString = (file: File): Future<string> =>
  Future.tryCatch(() => fs.promises.readFile(file.path, { encoding: 'utf-8' }))

const rmrf = (f: FileOrDir, options: rimraf.Options = {}): Future<void> =>
  Future.tryCatch(
    () =>
      /* eslint-disable functional/no-return-void */
      new Promise<void>((resolve, reject) =>
        rimraf(f.path, options, (error: Error | null | undefined) =>
          error === null ? resolve() : reject(error),
        ),
      ),
    /* eslint-enable functional/no-return-void */
  )

const stat = (f: FileOrDir): Future<Maybe<fs.Stats>> =>
  pipe(
    Future.tryCatch(() => fs.promises.stat(f.path)),
    Future.map(Maybe.some),
    Future.orElse(() => Future.right<Maybe<fs.Stats>>(Maybe.none)),
  )

const writeFile = (file: File, data: FileWritable): Future<void> =>
  Future.tryCatch(() => fs.promises.writeFile(file.path, data))

export const FsUtils = {
  exists,
  mkdir,
  readdir,
  readFileBuffer,
  readFileString,
  rmrf,
  stat,
  writeFile,
}
