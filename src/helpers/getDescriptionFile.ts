import { pipe } from 'fp-ts/function'

import { config } from '../config'
import type { File } from '../models/FileOrDir'
import { Dir } from '../models/FileOrDir'

export const getDescriptionFile = (postDir: Dir): File =>
  pipe(postDir, Dir.joinFile(config.maoureu.descriptionJson))
