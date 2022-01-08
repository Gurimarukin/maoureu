/* eslint-disable functional/immutable-data,
                  functional/no-expression-statement,
                  functional/no-loop-statement,
                  functional/no-return-void,
                  functional/no-throw-statement,
                  functional/prefer-readonly-type */
import { Try } from './fp'
import type { List } from './fp'

// https://github.com/sindresorhus/srcset/blob/dac174c44889344e273f626452d45645e532bfa6/index.js

export type SrcSetDefinition = Readonly<MutableSrcSetDefinition>

type MutableSrcSetDefinition = {
  url: string
  width?: number
  height?: number
  density?: number
}

type AllDescriptors = Record<string, Record<string, boolean>> & {
  fallback?: boolean | null
}

const imageCandidateRegex = /\s*([^,]\S*[^,](?:\s+[^,]+)?)\s*(?:,|$)/

const duplicateDescriptorCheck = (
  allDescriptors_: AllDescriptors | undefined,
  value: number,
  postfix_: string | undefined,
): void => {
  const allDescriptors = allDescriptors_ as AllDescriptors
  const postfix = postfix_ as string
  allDescriptors[postfix] = allDescriptors[postfix] ?? {}
  if ((allDescriptors[postfix] as Record<string, boolean>)[value] === true) {
    throw new Error(
      `No more than one image candidate is allowed for a given descriptor: ${value}${postfix}`,
    )
  }

  ;(allDescriptors[postfix] as Record<string, boolean>)[value] = true
}

const fallbackDescriptorDuplicateCheck = (allDescriptors_: AllDescriptors | undefined): void => {
  const allDescriptors = allDescriptors_ as AllDescriptors
  if (allDescriptors.fallback !== undefined && allDescriptors.fallback !== null) {
    throw new Error('Only one fallback image candidate is allowed')
  }

  if ((allDescriptors.x as Record<string, boolean>)['1'] === true) {
    throw new Error('A fallback image is equivalent to a 1x descriptor, providing both is invalid.')
  }

  allDescriptors.fallback = true
}

const descriptorCountCheck = (
  allDescriptors: AllDescriptors | undefined,
  currentDescriptors: List<string>,
): void => {
  if (currentDescriptors.length === 0) {
    fallbackDescriptorDuplicateCheck(allDescriptors)
  } else if (currentDescriptors.length > 1) {
    throw new Error(
      `Image candidate may have no more than one descriptor, found ${
        currentDescriptors.length
      }: ${currentDescriptors.join(' ')}`,
    )
  }
}

const validDescriptorCheck = (
  value: number,
  postfix: string | undefined,
  descriptor: string,
): void => {
  if (Number.isNaN(value)) {
    throw new TypeError(`${descriptor !== '' ? descriptor : value} is not a valid number`)
  }

  switch (postfix) {
    case 'w': {
      if (value <= 0) {
        throw new Error('Width descriptor must be greater than zero')
      } else if (!Number.isInteger(value)) {
        throw new TypeError('Width descriptor must be an integer')
      }

      break
    }

    case 'x': {
      if (value <= 0) {
        throw new Error('Pixel density descriptor must be greater than zero')
      }

      break
    }

    case 'h': {
      throw new Error('Height descriptor is no longer allowed')
    }

    default: {
      throw new Error(`Invalid srcset descriptor: ${descriptor}`)
    }
  }
}

export const parseSrcset = (
  string: string,
  { strict = false } = {},
): Try<List<SrcSetDefinition>> => {
  const allDescriptors: AllDescriptors | undefined = strict ? {} : undefined

  return Try.tryCatch(() =>
    string
      .split(imageCandidateRegex)
      .filter((part, index) => index % 2 === 1)
      .map(part => {
        const [url, ...descriptors] = part.trim().split(/\s+/)

        const result: MutableSrcSetDefinition = { url: url as string }

        if (strict) {
          descriptorCountCheck(allDescriptors, descriptors)
        }

        for (const descriptor of descriptors) {
          const postfix = descriptor[descriptor.length - 1]
          const value = Number.parseFloat(descriptor.slice(0, -1))

          if (strict) {
            validDescriptorCheck(value, postfix, descriptor)
            duplicateDescriptorCheck(allDescriptors, value, postfix)
          }

          switch (postfix) {
            case 'w': {
              result.width = value
              break
            }

            case 'h': {
              result.height = value
              break
            }

            case 'x': {
              result.density = value
              break
            }

            // No default
          }
        }

        return result
      }),
  )
}
