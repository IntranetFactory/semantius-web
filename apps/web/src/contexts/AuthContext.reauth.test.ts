import { describe, it, expect } from 'vitest'
import { isTokenRejection, planTokenReauth } from './AuthContext'

/**
 * Guards the token self-heal logic. The payloads below are the REAL responses
 * observed from the live endpoints (see responseError() — it captures them onto
 * error.cause):
 *   - PostgREST refuses an unverifiable token with 400 {"message":"jwk not found"}
 *   - the OAuth userinfo endpoint answers 500 with an empty body
 * so the rejection signal is the body/message, NOT a consistent 401.
 */
const err = (cause: unknown) => new Error('fetch failed', { cause })

// Exactly what responseError() attaches for each real case:
const jwkNotFound = err({ status: 400, url: '/rpc/get_userinfo', response: { code: null, detail: null, hint: null, message: 'jwk not found' } })
const invalidAccessToken = err({ status: 400, url: '/userinfo', response: { error: 'invalid_request', error_description: 'Invalid access token' } })
const userinfo500 = err({ status: 500, url: '/userinfo', response: '' })
const unauthorized = err({ status: 401, url: '/userinfo', response: '' })
const forbidden = err({ status: 403, url: '/rpc/get_userinfo', response: {} })
const relationMissing = err({ status: 404, url: '/rpc/x', response: { code: '42P01', message: 'relation "public.x" does not exist' } })
const networkError = new TypeError('Failed to fetch') // no cause — transient

describe('isTokenRejection', () => {
  it('flags a token the server cannot verify (PostgREST "jwk not found", 400)', () => {
    expect(isTokenRejection(jwkNotFound)).toBe(true)
  })
  it('flags an OAuth "Invalid access token" (400)', () => {
    expect(isTokenRejection(invalidAccessToken)).toBe(true)
  })
  it('flags 401 / 403 regardless of body', () => {
    expect(isTokenRejection(unauthorized)).toBe(true)
    expect(isTokenRejection(forbidden)).toBe(true)
  })
  it('does NOT flag a bare 500 with empty body (ambiguous — could be an outage)', () => {
    expect(isTokenRejection(userinfo500)).toBe(false)
  })
  it('does NOT flag a transient network error (no cause)', () => {
    expect(isTokenRejection(networkError)).toBe(false)
  })
  it('does NOT flag an unrelated 404 (missing relation)', () => {
    expect(isTokenRejection(relationMissing)).toBe(false)
  })
})

describe('planTokenReauth', () => {
  it('re-authenticates once on a fresh token rejection', () => {
    expect(planTokenReauth([jwkNotFound], false)).toBe('reauth')
  })

  it('LOOP GUARD: does NOT re-authenticate again once already attempted — shows the error instead', () => {
    // This is the critical safety property: a token refused for a non-transient
    // reason (rotated keys, wrong tenant) must not cause an infinite login loop.
    expect(planTokenReauth([jwkNotFound], true)).toBe('show-error')
  })

  it('still triggers when only one of several fetches carries the rejection signal', () => {
    // userinfo 500 (no signal) + rpc "jwk not found" (signal) → reauth
    expect(planTokenReauth([userinfo500, jwkNotFound], false)).toBe('reauth')
    // ...and the guard still holds on the second pass
    expect(planTokenReauth([userinfo500, jwkNotFound], true)).toBe('show-error')
  })

  it('resets the one-shot guard on a clean success', () => {
    expect(planTokenReauth([], false)).toBe('reset-guard')
    expect(planTokenReauth([], true)).toBe('reset-guard')
  })

  it('does NOT log the user out on a transient/non-token failure', () => {
    expect(planTokenReauth([networkError], false)).toBe('show-error')
    expect(planTokenReauth([userinfo500], false)).toBe('show-error')
    expect(planTokenReauth([relationMissing], false)).toBe('show-error')
  })
})
