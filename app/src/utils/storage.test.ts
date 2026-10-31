import { describe, it, expect, beforeEach } from 'vitest'
import { readString, writeString, readSavedName, SAVED_NAME_KEY } from './storage'

describe('Utils: storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('readString returns null if key does not exist', () => {
    expect(readString('non_existent_key')).toBeNull()
  })

  it('writeString saves string and readString retrieves it', () => {
    writeString('test_key', 'test_value')
    expect(readString('test_key')).toBe('test_value')
  })

  it('readSavedName reads the saved name from localStorage', () => {
    expect(readSavedName()).toBe('')
    localStorage.setItem(SAVED_NAME_KEY, 'Алексей')
    expect(readSavedName()).toBe('Алексей')
  })
})
