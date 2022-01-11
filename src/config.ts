import { pipe } from 'fp-ts/function'
import path from 'path'

import type { IndexHtmlArgs } from './helpers/indexHtml'
import { Dir, File } from './models/FileOrDir'

// assuming cwd is projet root

const outputDir = Dir.of(path.resolve('output'))
const outputMaoureuDir = pipe(outputDir, Dir.joinDir('maoureu'))
const outputMaoureuIndexHtml = pipe(outputMaoureuDir, Dir.joinFile('index.html'))

const maoureuWebappDir = Dir.of(path.resolve('src', 'webapp'))

export const config = {
  output: {
    dir: outputDir,
    cache: { dir: pipe(outputDir, Dir.joinDir('cache')) },
    maoureu: {
      dir: outputMaoureuDir,
      posts: { dir: pipe(outputMaoureuDir, Dir.joinDir('posts')) },
      indexHtml: outputMaoureuIndexHtml,
      postsJson: pipe(outputMaoureuDir, Dir.joinFile('posts.json')),
    },
  },

  maoureu: {
    descriptionJson: 'description.json',
    indexHtmlArgs: ((): Pick<IndexHtmlArgs, 'title' | 'appCss'> => ({
      title: 'Les Maoureuses',
      appCss: pipe(
        File.dir(outputMaoureuIndexHtml),
        Dir.relative(pipe(maoureuWebappDir, Dir.joinFile('css', 'app.css'))),
      ),
    }))(),
    webapp: {
      dir: maoureuWebappDir,
      images: { dir: pipe(maoureuWebappDir, Dir.joinDir('images')) },
    },
    urls: {
      page: (i: number): string => `https://maour.eu/page/${i}`,
    },
  },
}
