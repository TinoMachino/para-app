import {describe, expect, it} from '@jest/globals'

import {formatUserDisplayName} from '#/lib/strings/profile-names'

describe('formatUserDisplayName', () => {
  it('prefixes individual profiles with i/', () => {
    expect(
      formatUserDisplayName({
        displayName: 'Alice',
        handle: 'alice.test',
        isFigure: false,
      }),
    ).toBe('i/Alice')
  })

  it('prefixes figure profiles with f/', () => {
    expect(
      formatUserDisplayName({
        displayName: 'Mayor Garcia',
        handle: 'garcia.test',
        isFigure: true,
      }),
    ).toBe('f/Mayor Garcia')
  })

  it('falls back to the sanitized handle when there is no display name', () => {
    expect(
      formatUserDisplayName({
        handle: 'alice.test',
        isFigure: false,
      }),
    ).toBe('i/alice.test')
  })
})
