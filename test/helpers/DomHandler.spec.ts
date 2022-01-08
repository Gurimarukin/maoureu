/* eslint-disable functional/no-return-void */
import { DomHandler } from '../../src/helpers/DomHandler'

describe('instances', () => {
  it('should parse HTMLAnchorElement', () => {
    const domHandler = DomHandler.of('<a href="blbl.ch">toto</a>')
    expect(domHandler.document.querySelector('a')).toBeInstanceOf(domHandler.HTMLAnchorElement)
  })
})
