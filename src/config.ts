import { pipe } from 'fp-ts/function'
import path from 'path'

import { Dir } from './models/FileOrDir'

const outputDir: Dir = Dir.of(path.join(__dirname, '..', 'output'))
const outputMaoureuDir = pipe(outputDir, Dir.joinDir('maoureu'))

export const config = {
  output: {
    dir: outputDir,
    cache: { dir: pipe(outputDir, Dir.joinDir('cache')) },
    maoureu: {
      dir: outputMaoureuDir,
      posts: { dir: pipe(outputMaoureuDir, Dir.joinDir('posts')) },
    },
  },

  maoureu: {
    page: (i: number): string => `https://maour.eu/page/${i}`,
  },
}
