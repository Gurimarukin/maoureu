import type fs from 'fs'
import nodePath from 'path'

import { createUnion } from '../utils/createUnion'
import type { List } from '../utils/fp'

type FileArgs = {
  readonly path: string
  readonly basename: string
  readonly dirname: string
}

const u = createUnion({
  File: (args: FileArgs) => args,
  Dir: (path: string) => ({ path }),
})

export type FileOrDir = typeof u.T

export type File = typeof u.File.T

export type Dir = typeof u.Dir.T

const fromDirent =
  (parent: Dir) =>
  (f: fs.Dirent): FileOrDir => {
    const path = nodePath.join(parent.path, f.name)
    return f.isDirectory()
      ? Dir.of(path)
      : File.of({ path, basename: f.name, dirname: parent.path })
  }

export const FileOrDir = { fromDirent }

const fileOf: (args: FileArgs) => File = u.File

export const File = {
  of: fileOf,
  fromPath: (path: string): File =>
    File.of({
      path,
      basename: nodePath.basename(path),
      dirname: nodePath.dirname(path),
    }),
  dir: (file: File): Dir => Dir.of(file.dirname),
  stringify: ({ path, basename, dirname }: File): string =>
    `File(${path}, ${basename}, ${dirname})`,
}

const dirOf: (path: string) => Dir = u.Dir

function dirRelative(to: File): (from: Dir) => File
function dirRelative(to: Dir): (from: Dir) => Dir
function dirRelative(to: FileOrDir): (from: Dir) => FileOrDir {
  return from => {
    const path = nodePath.relative(from.path, to.path)
    switch (to.type) {
      case 'Dir':
        return Dir.of(path)
      case 'File':
        return File.fromPath(path)
    }
  }
}

export const Dir = {
  of: dirOf,
  joinDir:
    (path: string, ...paths: List<string>) =>
    (dir: Dir): Dir =>
      dirOf(nodePath.join(dir.path, path, ...paths)),
  joinFile:
    (path: string, ...paths: List<string>) =>
    (dir: Dir): File =>
      File.fromPath(nodePath.join(dir.path, path, ...paths)),
  relative: dirRelative,
}
