import { pipe } from 'fp-ts/function'
import path from 'path'

import type { IndexHtmlArgs } from './helpers/indexHtml'
import { Dir } from './models/FileOrDir'

const outputDir: Dir = Dir.of(path.join(__dirname, '..', 'output'))
const outputMaoureuDir = pipe(outputDir, Dir.joinDir('maoureu'))

const maoureuIndexHtmlArgs: Pick<IndexHtmlArgs, 'title' | 'resetCss'> = {
  title: 'Les Maoureuses',
  resetCss: path.join('..', '..', 'src', 'webapp', 'reset.css'),
}

export const config = {
  output: {
    dir: outputDir,
    cache: { dir: pipe(outputDir, Dir.joinDir('cache')) },
    maoureu: {
      dir: outputMaoureuDir,
      posts: { dir: pipe(outputMaoureuDir, Dir.joinDir('posts')) },
      indexHtml: pipe(outputMaoureuDir, Dir.joinFile('index.html')),
      postsJson: pipe(outputMaoureuDir, Dir.joinFile('posts.json')),
    },
  },

  maoureu: {
    descriptionJson: 'description.json',
    indexHtmlArgs: maoureuIndexHtmlArgs,
    urls: {
      page: (i: number): string => `https://maour.eu/page/${i}`,
    },
  },
}
