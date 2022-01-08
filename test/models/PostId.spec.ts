import { PostId } from '../../src/models/PostId'
import { Maybe } from '../../src/utils/fp'

/* eslint-disable functional/no-return-void */
describe('PostId.fromUrl', () => {
  it('should parse url', () => {
    const url = 'https://maour.eu/2021/09/01/le-mythe-de-la-moitie-3-3/'
    expect(PostId.fromUrl(url)).toStrictEqual(Maybe.some('2021_09_01_le-mythe-de-la-moitie-3-3'))
  })
})
