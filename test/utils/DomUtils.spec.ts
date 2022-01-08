/* eslint-disable functional/no-return-void */
import { DomUtils } from '../../src/utils/DomUtils'

describe('instances', () => {
  it('should parse HTMLAnchorElement', () => {
    const doc = DomUtils.documentFromHtml('<a href="blbl.ch">toto</a>')

    expect(doc.querySelector('a')).toBeInstanceOf(doc)
  })
})
