// ==================== app/utils/storage.js ====================

/**
 * Enhanced storage utility with comprehensive SSR protection
 * and error handling for localStorage operations
 */

// Check if we're in a browser environment
const isBrowser = () => {
  return (
    typeof window !== 'undefined' && 
    typeof window.localStorage !== 'undefined' &&
    window.localStorage !== null
  )
}

// Test localStorage availability (handles private browsing, quota issues, etc.)
const isStorageAvailable = () => {
  if (!isBrowser()) return false
  
  try {
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, 'test')
    window.localStorage.removeItem(testKey)
    return true
  } catch (error) {
    console.warn('localStorage is not available:', error.message)
    return false
  }
}

// In-memory fallback storage for SSR or when localStorage is unavailable
let memoryStorage = new Map()

const storage = {
  /**
   * Get an item from storage
   * @param {string} key - The storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} The stored value or default value
   */
  get: (key, defaultValue = null) => {
    // Return default immediately during SSR
    if (!isBrowser()) {
      return defaultValue
    }

    try {
      // Try localStorage first
      if (isStorageAvailable()) {
        const item = window.localStorage.getItem(key)
        return item ? JSON.parse(item) : defaultValue
      }
      
      // Fall back to memory storage
      const memoryItem = memoryStorage.get(key)
      return memoryItem !== undefined ? memoryItem : defaultValue
      
    } catch (error) {
      console.warn(`Failed to read '${key}' from storage:`, error.message)
      
      // Try memory storage as final fallback
      try {
        const memoryItem = memoryStorage.get(key)
        return memoryItem !== undefined ? memoryItem : defaultValue
      } catch (memoryError) {
        console.warn(`Memory storage also failed for '${key}':`, memoryError.message)
        return defaultValue
      }
    }
  },

  /**
   * Set an item in storage
   * @param {string} key - The storage key
   * @param {any} value - The value to store
   * @returns {boolean} Success status
   */
  set: (key, value) => {
    // Fail silently during SSR
    if (!isBrowser()) {
      return false
    }

    try {
      const serializedValue = JSON.stringify(value)
      
      // Try localStorage first
      if (isStorageAvailable()) {
        window.localStorage.setItem(key, serializedValue)
        // Also store in memory as backup
        memoryStorage.set(key, value)
        return true
      }
      
      // Fall back to memory storage
      memoryStorage.set(key, value)
      console.info(`Using memory storage for '${key}' (localStorage unavailable)`)
      return true
      
    } catch (error) {
      console.warn(`Failed to write '${key}' to storage:`, error.message)
      
      // Try memory storage as final fallback
      try {
        memoryStorage.set(key, value)
        console.info(`Fell back to memory storage for '${key}'`)
        return true
      } catch (memoryError) {
        console.error(`All storage methods failed for '${key}':`, memoryError.message)
        return false
      }
    }
  },

  /**
   * Remove an item from storage
   * @param {string} key - The storage key
   * @returns {boolean} Success status
   */
  remove: (key) => {
    // Fail silently during SSR
    if (!isBrowser()) {
      return false
    }

    try {
      // Remove from localStorage if available
      if (isStorageAvailable()) {
        window.localStorage.removeItem(key)
      }
      
      // Also remove from memory storage
      memoryStorage.delete(key)
      return true
      
    } catch (error) {
      console.warn(`Failed to remove '${key}' from storage:`, error.message)
      
      // Try memory storage as fallback
      try {
        memoryStorage.delete(key)
        return true
      } catch (memoryError) {
        console.error(`Failed to remove '${key}' from memory storage:`, memoryError.message)
        return false
      }
    }
  },

  /**
   * Clear all storage
   * @returns {boolean} Success status
   */
  clear: () => {
    // Fail silently during SSR
    if (!isBrowser()) {
      return false
    }

    try {
      // Clear localStorage if available
      if (isStorageAvailable()) {
        window.localStorage.clear()
      }
      
      // Clear memory storage
      memoryStorage.clear()
      return true
      
    } catch (error) {
      console.warn('Failed to clear storage:', error.message)
      
      // Try memory storage as fallback
      try {
        memoryStorage.clear()
        return true
      } catch (memoryError) {
        console.error('Failed to clear memory storage:', memoryError.message)
        return false
      }
    }
  },

  /**
   * Get all keys in storage
   * @returns {string[]} Array of storage keys
   */
  keys: () => {
    // Return empty array during SSR
    if (!isBrowser()) {
      return []
    }

    try {
      const keys = new Set()
      
      // Get localStorage keys if available
      if (isStorageAvailable()) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key) keys.add(key)
        }
      }
      
      // Add memory storage keys
      for (const key of memoryStorage.keys()) {
        keys.add(key)
      }
      
      return Array.from(keys)
      
    } catch (error) {
      console.warn('Failed to get storage keys:', error.message)
      return Array.from(memoryStorage.keys())
    }
  },

  /**
   * Check if storage is available and working
   * @returns {boolean} Storage availability status
   */
  isAvailable: () => {
    return isBrowser() && isStorageAvailable()
  },

  /**
   * Get storage type being used
   * @returns {string} 'localStorage' | 'memory' | 'none'
   */
  getStorageType: () => {
    if (!isBrowser()) return 'none'
    if (isStorageAvailable()) return 'localStorage'
    return 'memory'
  },

  /**
   * Get storage usage info (localStorage only)
   * @returns {object} Storage usage information
   */
  getUsageInfo: () => {
    if (!isBrowser() || !isStorageAvailable()) {
      return { used: 0, available: 0, total: 0, percentage: 0 }
    }

    try {
      // Estimate localStorage usage
      let used = 0
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        const value = window.localStorage.getItem(key)
        if (key && value) {
          used += key.length + value.length
        }
      }

      // Most browsers have ~5-10MB limit for localStorage
      const estimated_total = 5 * 1024 * 1024 // 5MB in bytes
      const available = estimated_total - used
      const percentage = (used / estimated_total) * 100

      return {
        used,
        available,
        total: estimated_total,
        percentage: Math.round(percentage * 100) / 100
      }
    } catch (error) {
      console.warn('Failed to get storage usage info:', error.message)
      return { used: 0, available: 0, total: 0, percentage: 0 }
    }
  }
}

export default storage

// Export storage utilities for advanced use cases
export {
  isBrowser,
  isStorageAvailable,
  storage
}
