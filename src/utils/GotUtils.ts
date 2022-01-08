import got from 'got'

import { Future } from './fp'

// const get = (url: string): Future<boolean> => Future.tryCatch(() => got.get(url))

const getText = (url: string): Future<string> => Future.tryCatch(() => got.get(url).text())

export const GotUtils = { getText }
