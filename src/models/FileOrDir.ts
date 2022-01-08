import { pipe } from 'fp-ts/function'
import type fs from 'fs'
import nodePath from 'path'

import type { List } from '../utils/fp'
import { IO } from '../utils/fp'

export type FileOrDir = File | Dir

export type File = {
  readonly _tag: 'File'
  readonly path: string
  readonly basename: string
  readonly dirname: string
}

export type Dir = {
  readonly _tag: 'Dir'
  readonly path: string
}

const isFile = (f: FileOrDir): f is File => f._tag === 'File'
const isDir = (f: FileOrDir): f is Dir => f._tag === 'Dir'

const fromDirent =
  (parent: Dir) =>
  (f: fs.Dirent): FileOrDir => {
    const path = nodePath.join(parent.path, f.name)
    return f.isDirectory()
      ? Dir.of(path)
      : File.of({ path, basename: f.name, dirname: parent.path })
  }

export const FileOrDir = { isFile, isDir, fromDirent }

const fileFromPath = (path: string): File =>
  File.of({
    path,
    basename: nodePath.basename(path),
    dirname: nodePath.dirname(path),
  })

export const File = {
  of: ({ path, basename, dirname }: Omit<File, '_tag'>): File => ({
    _tag: 'File',
    path,
    basename,
    dirname,
  }),
  fromPath: fileFromPath,
  setBasename:
    (basename: string) =>
    (file: File): File =>
      fileFromPath(nodePath.join(file.dirname, basename)),
  stringify: ({ path, basename, dirname }: File): string =>
    `File(${path}, ${basename}, ${dirname})`,
}

const dirOf = (path: string): Dir => ({ _tag: 'Dir', path })

export const Dir = {
  of: dirOf,
  resolveDir:
    (path: string, ...paths: List<string>) =>
    (dir: Dir): IO<Dir> =>
      pipe(
        IO.tryCatch(() => nodePath.resolve(dir.path, path, ...paths)),
        IO.map(dirOf),
      ),
  joinDir:
    (path: string, ...paths: List<string>) =>
    (dir: Dir): Dir =>
      dirOf(nodePath.join(dir.path, path, ...paths)),
  joinFile:
    (path: string, ...paths: List<string>) =>
    (dir: Dir): File =>
      File.fromPath(nodePath.join(dir.path, path, ...paths)),
}
