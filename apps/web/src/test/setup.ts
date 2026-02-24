import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Polyfills for jsdom
if (typeof Element !== 'undefined') {
  // Polyfill for hasPointerCapture (used by Radix UI)
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function () {
      return false
    }
  }
  
  // Polyfill for scrollIntoView (used by SchemaForm)
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function () {
      // no-op
    }
  }
  
  // Polyfill for setPointerCapture/releasePointerCapture (used by Radix UI)
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function () {
      // no-op
    }
  }
  
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function () {
      // no-op
    }
  }
}

// Cleanup after each test
afterEach(() => {
  cleanup()
})
