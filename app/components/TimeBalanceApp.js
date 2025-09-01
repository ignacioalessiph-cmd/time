// ==================== app/components/TimeBalanceApp.js ====================
'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Play, Pause, Check, Trash2, List, StickyNote, Target, Save, Download, AlertCircle } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'
import LoadingSpinner from './LoadingSpinner'
import ThermometerDisplay from './ui/ThermometerDisplay'
import storage from '../utils/storage' // Use enhanced storage utility

// Constants
const STORAGE_KEYS = {
  OUTCOMES: 'timebalance-outcomes',
  NOTES: 'timebalance-notes', 
  TIME_BANK: 'timebalance-timebank',
  TIMER: 'timebalance-timer',
  LAST_SAVED: 'timebalance-lastsaved'
}

const DEFAULT_OUTCOMES = [
  {
    id: 1,
    title: "Write Marketing Blog Post",
    steps: [
      { id: 1, title: "Research competitors & trends", estimatedMin: 60, actualMin: null, completed: false, timeSpent: 0 },
      { id: 2, title: "Create detailed outline", estimatedMin: 45, actualMin: null, completed: false, timeSpent: 0 },
      { id: 3, title: "Write first draft", estimatedMin: 120, actualMin: null, completed: false, timeSpent: 0 },
      { id: 4, title: "Edit, optimize & publish", estimatedMin: 30, actualMin: null, completed: false, timeSpent: 0 }
    ]
  },
  {
    id: 2,
    title: "Design Client Logo",
    steps: [
      { id: 1, title: "Research brand & create mood board", estimatedMin: 90, actualMin: null, completed: false, timeSpent: 0 },
      { id: 2, title: "Sketch 10 initial concepts", estimatedMin: 75, actualMin: null, completed: false, timeSpent: 0 },
      { id: 3, title: "Create 3 digital versions", estimatedMin: 60, actualMin: null, completed: false, timeSpent: 0 },
      { id: 4, title: "Refine chosen concept", estimatedMin: 45, actualMin: null, completed: false, timeSpent: 0 }
    ]
  }
]

const TimeBalanceApp = () => {
  // Core state
  const [outcomes, setOutcomes] = useState([])
  const [activeTimer, setActiveTimer] = useState(null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [stepNotes, setStepNotes] = useState({})
  const [timeBank, setTimeBank] = useState(0)
  const [lastSaved, setLastSaved] = useState(null)
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [newOutcome, setNewOutcome] = useState('')
  const [editingOutcome, setEditingOutcome] = useState(null)
  const [editingStep, setEditingStep] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newStep, setNewStep] = useState({ title: '', estimatedMin: '' })
  const [addingStepTo, setAddingStepTo] = useState(null)
  const [editingNotes, setEditingNotes] = useState(null)
  const [notification, setNotification] = useState(null)
  const [storageType, setStorageType] = useState('none')

  // Memoized calculations
  const globalBalance = useMemo(() => {
    const outcomeBalance = outcomes.reduce((total, outcome) => {
      const completedSteps = outcome.steps.filter(step => step.completed)
      if (completedSteps.length === 0) return total
      
      const estimatedForCompleted = completedSteps.reduce((sum, step) => sum + step.estimatedMin, 0)
      const actualForCompleted = completedSteps.reduce((sum, step) => sum + (step.actualMin || 0), 0)
      
      return total + (estimatedForCompleted - actualForCompleted)
    }, 0)
    return outcomeBalance + timeBank
  }, [outcomes, timeBank])

  const totalEstimatedToday = useMemo(() => {
    return outcomes.reduce((total, outcome) => 
      total + outcome.steps.reduce((sum, step) => sum + step.estimatedMin, 0), 0
    )
  }, [outcomes])

  // Utility functions
  const formatTime = useCallback((minutes) => {
    if (minutes === 0) return "0m"
    const hours = Math.floor(Math.abs(minutes) / 60)
    const mins = Math.abs(minutes) % 60
    const sign = minutes < 0 ? "-" : "+"
    if (hours > 0) {
      return `${sign}${hours}h ${mins > 0 ? mins + "m" : ""}`.trim()
    }
    return `${sign}${mins}m`
  }, [])

  const formatSeconds = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // Data persistence with enhanced storage
  const saveData = useCallback(() => {
    try {
      const saveOperations = [
        storage.set(STORAGE_KEYS.OUTCOMES, outcomes),
        storage.set(STORAGE_KEYS.NOTES, stepNotes),
        storage.set(STORAGE_KEYS.TIME_BANK, timeBank),
        storage.set(STORAGE_KEYS.TIMER, { activeTimer, timerSeconds }),
        storage.set(STORAGE_KEYS.LAST_SAVED, new Date().toISOString())
      ]

      const allSuccessful = saveOperations.every(result => result === true)

      if (allSuccessful) {
        setLastSaved(new Date())
      } else {
        const currentStorageType = storage.getStorageType()
        if (currentStorageType === 'memory') {
          showNotification('Data saved to memory (localStorage unavailable)', 'warning')
        } else {
          showNotification('Some data may not have saved correctly', 'warning')
        }
      }
    } catch (error) {
      console.error('Error saving data:', error)
      showNotification('Failed to save data', 'error')
    }
  }, [outcomes, stepNotes, timeBank, activeTimer, timerSeconds, showNotification])

  const loadData = useCallback(() => {
    try {
      // Check storage availability and update state
      const currentStorageType = storage.getStorageType()
      setStorageType(currentStorageType)

      const savedOutcomes = storage.get(STORAGE_KEYS.OUTCOMES)
      const savedNotes = storage.get(STORAGE_KEYS.NOTES, {})
      const savedTimeBank = storage.get(STORAGE_KEYS.TIME_BANK, 0)
      const savedTimer = storage.get(STORAGE_KEYS.TIMER)
      const savedTime = storage.get(STORAGE_KEYS.LAST_SAVED)

      setOutcomes(savedOutcomes || DEFAULT_OUTCOMES)
      setStepNotes(savedNotes)
      setTimeBank(savedTimeBank)
      
      if (savedTimer) {
        setActiveTimer(savedTimer.activeTimer)
        setTimerSeconds(savedTimer.timerSeconds || 0)
      }
      
      if (savedTime) {
        setLastSaved(new Date(savedTime))
      }

      // Show storage type notification if not localStorage
      if (currentStorageType === 'memory') {
        showNotification('Using memory storage (data will not persist)', 'warning')
      } else if (currentStorageType === 'none') {
        showNotification('Storage unavailable - changes will not be saved', 'error')
      }

    } catch (error) {
      console.error('Error loading data:', error)
      showNotification('Failed to load saved data. Starting fresh.', 'warning')
      setOutcomes(DEFAULT_OUTCOMES)
    } finally {
      setIsLoading(false)
    }
  }, [showNotification])

  // Effects
  useEffect(() => {
    // Only load data on client side
    if (typeof window !== 'undefined') {
      loadData()
    }
  }, [loadData])

  useEffect(() => {
    if (!isLoading && outcomes.length > 0 && typeof window !== 'undefined') {
      saveData()
    }
  }, [outcomes, stepNotes, timeBank, activeTimer, timerSeconds, isLoading, saveData])

  useEffect(() => {
    let interval
    if (activeTimer && typeof window !== 'undefined') {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTimer])

  // Timer functions
  const startTimer = useCallback((outcomeId, stepId) => {
    setActiveTimer({ outcomeId, stepId })
    setTimerSeconds(0)
  }, [])

  const pauseTimer = useCallback(() => {
    if (activeTimer) {
      const timeToAdd = Math.ceil(timerSeconds / 60)
      setOutcomes(prev => prev.map(outcome => {
        if (outcome.id === activeTimer.outcomeId) {
          return {
            ...outcome,
            steps: outcome.steps.map(step => {
              if (step.id === activeTimer.stepId) {
                return { ...step, timeSpent: (step.timeSpent || 0) + timeToAdd }
              }
              return step
            })
          }
        }
        return outcome
      }))
    }
    setActiveTimer(null)
    setTimerSeconds(0)
  }, [activeTimer, timerSeconds])

  const addTime = useCallback(() => {
    if (activeTimer && timeBank >= 10) {
      setTimeBank(prev => prev - 10)
      setTimerSeconds(prev => prev + 600)
      showNotification('Added 10 minutes from time bank', 'success')
    } else {
      showNotification('Not enough time in bank', 'warning')
    }
  }, [activeTimer, timeBank, showNotification])

  const markStepDone = useCallback(() => {
    if (activeTimer) {
      const totalTime = Math.ceil(timerSeconds / 60)
      setOutcomes(prev => prev.map(outcome => {
        if (outcome.id === activeTimer.outcomeId) {
          return {
            ...outcome,
            steps: outcome.steps.map(step => {
              if (step.id === activeTimer.stepId) {
                return {
                  ...step,
                  actualMin: (step.timeSpent || 0) + totalTime,
                  completed: true,
                  timeSpent: 0
                }
              }
              return step
            })
          }
        }
        return outcome
      }))
      showNotification('Step completed!', 'success')
    }
    setActiveTimer(null)
    setTimerSeconds(0)
  }, [activeTimer, timerSeconds, showNotification])

  // Outcome and step management
  const addOutcome = useCallback(() => {
    if (!newOutcome.trim()) return

    const newId = Math.max(...outcomes.map(o => o.id), 0) + 1
    setOutcomes(prev => [...prev, {
      id: newId,
      title: newOutcome.trim(),
      steps: []
    }])
    setNewOutcome('')
    showNotification('Outcome added', 'success')
  }, [newOutcome, outcomes, showNotification])

  const addStep = useCallback((outcomeId) => {
    if (!newStep.title.trim() || !newStep.estimatedMin) return

    setOutcomes(prev => prev.map(outcome => {
      if (outcome.id === outcomeId) {
        const newStepId = Math.max(...outcome.steps.map(s => s.id), 0) + 1
        return {
          ...outcome,
          steps: [...outcome.steps, {
            id: newStepId,
            title: newStep.title.trim(),
            estimatedMin: parseInt(newStep.estimatedMin),
            actualMin: null,
            completed: false,
            timeSpent: 0
          }]
        }
      }
      return outcome
    }))
    
    setNewStep({ title: '', estimatedMin: '' })
    setAddingStepTo(null)
    showNotification('Step added', 'success')
  }, [newStep, showNotification])

  const removeOutcome = useCallback((outcomeId) => {
    if (!confirm('Delete this outcome and all its steps?')) return
    
    setOutcomes(prev => prev.filter(outcome => outcome.id !== outcomeId))
    showNotification('Outcome deleted', 'success')
  }, [showNotification])

  const removeStep = useCallback((outcomeId, stepId) => {
    setOutcomes(prev => prev.map(outcome => {
      if (outcome.id === outcomeId) {
        return {
          ...outcome,
          steps: outcome.steps.filter(step => step.id !== stepId)
        }
      }
      return outcome
    }))
    showNotification('Step deleted', 'success')
  }, [showNotification])

  // Editing functions
  const startEditOutcome = useCallback((outcomeId, currentTitle) => {
    setEditingOutcome(outcomeId)
    setEditValue(currentTitle)
  }, [])

  const saveOutcomeEdit = useCallback(() => {
    if (!editValue.trim()) return
    
    setOutcomes(prev => prev.map(outcome => {
      if (outcome.id === editingOutcome) {
        return { ...outcome, title: editValue.trim() }
      }
      return outcome
    }))
    
    setEditingOutcome(null)
    setEditValue('')
  }, [editingOutcome, editValue])

  const startEditStep = useCallback((outcomeId, stepId, currentTitle) => {
    setEditingStep({ outcomeId, stepId })
    setEditValue(currentTitle)
  }, [])

  const saveStepEdit = useCallback(() => {
    if (!editValue.trim()) return
    
    setOutcomes(prev => prev.map(outcome => {
      if (outcome.id === editingStep.outcomeId) {
        return {
          ...outcome,
          steps: outcome.steps.map(step => {
            if (step.id === editingStep.stepId) {
              return { ...step, title: editValue.trim() }
            }
            return step
          })
        }
      }
      return outcome
    }))
    
    setEditingStep(null)
    setEditValue('')
  }, [editingStep, editValue])

  // Notes functions
  const saveStepNote = useCallback((outcomeId, stepId, note) => {
    const today = new Date().toISOString().split('T')[0]
    const noteKey = `${outcomeId}-${stepId}-${today}`
    setStepNotes(prev => ({
      ...prev,
      [noteKey]: note
    }))
  }, [])

  const getStepNote = useCallback((outcomeId, stepId) => {
    const today = new Date().toISOString().split('T')[0]
    const noteKey = `${outcomeId}-${stepId}-${today}`
    return stepNotes[noteKey] || ''
  }, [stepNotes])

  // Data import/export
  const exportData = useCallback(() => {
    try {
      const exportData = {
        outcomes,
        stepNotes,
        timeBank,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timebalance-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showNotification('Data exported successfully', 'success')
    } catch (error) {
      console.error('Export failed:', error)
      showNotification('Export failed', 'error')
    }
  }, [outcomes, stepNotes, timeBank, showNotification])

  const importData = useCallback((event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        // Validate data structure
        if (!data.outcomes || !Array.isArray(data.outcomes)) {
          throw new Error('Invalid data format')
        }
        
        setOutcomes(data.outcomes)
        setStepNotes(data.stepNotes || {})
        setTimeBank(data.timeBank || 0)
        
        showNotification('Data imported successfully', 'success')
      } catch (error) {
        console.error('Import failed:', error)
        showNotification('Import failed: Invalid file format', 'error')
      }
    }
    
    reader.onerror = () => {
      showNotification('Failed to read file', 'error')
    }
    
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }, [showNotification])

  const clearAllData = useCallback(() => {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return
    
    try {
      // Clear state
      setOutcomes([])
      setStepNotes({})
      setTimeBank(0)
      setActiveTimer(null)
      setTimerSeconds(0)
      setLastSaved(null)
      
      // Clear storage
      Object.values(STORAGE_KEYS).forEach(key => storage.remove(key))
      
      showNotification('All data cleared', 'success')
    } catch (error) {
      console.error('Clear data failed:', error)
      showNotification('Failed to clear data', 'error')
    }
  }, [showNotification])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S to export
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        exportData()
      }
      
      // Escape to cancel editing
      if (e.key === 'Escape') {
        setEditingOutcome(null)
        setEditingStep(null)
        setEditingNotes(null)
        setAddingStepTo(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [exportData])

  // Show different loading states based on storage type
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" className="mb-4" />
          <p className="text-gray-400">Loading your time balance data...</p>
          {storageType === 'memory' && (
            <p className="text-yellow-400 text-sm mt-2">Using memory storage - changes won't persist</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Notification */}
          {notification && (
            <div 
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slide-up ${
                notification.type === 'error' ? 'bg-red-500 text-white' :
                notification.type === 'warning' ? 'bg-yellow-500 text-black' :
                notification.type === 'success' ? 'bg-emerald-500 text-white' :
                'bg-blue-500 text-white'
              }`}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                {notification.type === 'error' && <AlertCircle size={16} />}
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 p-4 card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 sm:mb-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  storageType === 'localStorage' ? 'bg-emerald-400 animate-pulse-slow' :
                  storageType === 'memory' ? 'bg-yellow-400 animate-pulse-slow' :
                  'bg-red-400'
                }`} />
                <span className={`text-sm font-medium ${
                  storageType === 'localStorage' ? 'text-emerald-400' :
                  storageType === 'memory' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {storageType === 'localStorage' ? 'Auto-saving enabled' :
                   storageType === 'memory' ? 'Memory storage active' :
                   'Storage unavailable'}
                </span>
              </div>
              {lastSaved && (
                <div className="text-gray-400 text-sm">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportData}
                className="btn-secondary flex items-center gap-2 text-xs sm:text-sm"
                title="Export data (Ctrl+S)"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              <label className="btn-secondary flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                <Save size={14} />
                <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                  aria-label="Import data file"
                />
              </label>
              
              <button
                onClick={clearAllData}
                className="bg-red-500 hover:bg-red-400 text-white px-3 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Header Cards */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 mb-6 lg:mb-10">
            {/* Today's Plan - Compact */}
            <div className="w-full lg:w-52 card p-4 lg:p-5 order-2 lg:order-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-blue-400" size={16} />
                <span className="text-blue-300 font-semibold tracking-wider text-xs">TODAY'S PLAN</span>
              </div>
              <div className="text-xl lg:text-2xl font-light text-white mb-1">
                {formatTime(totalEstimatedToday).replace('+', '')}
              </div>
              <div className="text-blue-400 text-xs font-medium">
                Total estimated
              </div>
            </div>

            {/* Time Balance - Large */}
            <div className={`flex-1 rounded-3xl shadow-2xl border p-6 lg:p-10 order-1 lg:order-2 transition-colors duration-500 ${
              globalBalance >= 0 ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-gray-800 border-gray-700'
            }`}>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-3 font-medium">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-lg font-semibold text-gray-300 mb-4 tracking-wider">
                  TIME BALANCE
                </div>
                <div className={`text-6xl lg:text-8xl font-extralight mb-4 transition-colors duration-300 ${
                  globalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {globalBalance === 0 ? '0m' : formatTime(globalBalance)}
                </div>
                {globalBalance > 0 && (
                  <div className="text-emerald-400 font-medium">
                    Available in 10min chunks
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add Outcome */}
          <div className="card p-6 lg:p-8 mb-6 lg:mb-10">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Get something done rather than nothing"
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addOutcome()}
                className="input-field flex-1"
                maxLength={100}
              />
              <button
                onClick={addOutcome}
                disabled={!newOutcome.trim()}
                className="btn-primary flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Plus size={18} />
                <span>Add Outcome</span>
              </button>
            </div>
          </div>

          {/* Outcomes List */}
          <div className="space-y-6">
            {outcomes.length === 0 ? (
              <div className="card p-12 text-center">
                <Target size={48} className="mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No outcomes yet</h3>
                <p className="text-gray-400">Add your first outcome above to get started with time banking.</p>
              </div>
            ) : (
              outcomes.map(outcome => {
                const balance = useMemo(() => {
                  const completedSteps = outcome.steps.filter(step => step.completed)
                  if (completedSteps.length === 0) return 0
                  
                  const estimatedForCompleted = completedSteps.reduce((sum, step) => sum + step.estimatedMin, 0)
                  const actualForCompleted = completedSteps.reduce((sum, step) => sum + (step.actualMin || 0), 0)
                  
                  return estimatedForCompleted - actualForCompleted
                }, [outcome.steps])
                
                const totalEstimated = useMemo(() => 
                  outcome.steps.reduce((sum, step) => sum + step.estimatedMin, 0), [outcome.steps]
                )
                
                return (
                  <div key={outcome.id} className="card overflow-hidden animate-fade-in">
                    
                    {/* Outcome Header */}
                    <div className="px-6 lg:px-8 py-6 border-b border-gray-700">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <button
                            onClick={() => setAddingStepTo(addingStepTo === outcome.id ? null : outcome.id)}
                            className="text-gray-400 hover:text-blue-400 p-3 hover:bg-gray-700 rounded-2xl transition-all duration-200 focus-visible flex-shrink-0"
                            title="Add step"
                            aria-label="Add step to this outcome"
                          >
                            <List size={18} />
                          </button>
                          
                          {editingOutcome === outcome.id ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && saveOutcomeEdit()}
                              onBlur={saveOutcomeEdit}
                              className="text-xl lg:text-2xl font-light bg-transparent border-b-2 border-blue-400 focus:outline-none text-white flex-1 min-w-0"
                              autoFocus
                              maxLength={100}
                            />
                          ) : (
                            <h2 
                              className="text-xl lg:text-2xl font-light text-white cursor-pointer hover:text-blue-400 transition-colors flex-1 min-w-0 truncate"
                              onClick={() => startEditOutcome(outcome.id, outcome.title)}
                              title="Click to edit"
                            >
                              {outcome.title}
                            </h2>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm text-gray-400 font-medium">
                            Total: {formatTime(totalEstimated).replace('+', '')}
                          </div>
                          <button
                            onClick={() => removeOutcome(outcome.id)}
                            className="text-red-400 hover:text-red-300 p-3 hover:bg-red-900/30 rounded-2xl transition-all duration-200 focus-visible"
                            title="Delete outcome"
                            aria-label="Delete this outcome"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Add Step Input */}
                      {addingStepTo === outcome.id && (
                        <div className="mt-6 animate-slide-up">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <input
                              type="text"
                              placeholder="Step title..."
                              value={newStep.title}
                              onChange={(e) => setNewStep({...newStep, title: e.target.value})}
                              className="input-field flex-1"
                              maxLength={100}
                            />
                            <input
                              type="number"
                              placeholder="Minutes"
                              value={newStep.estimatedMin}
                              onChange={(e) => setNewStep({...newStep, estimatedMin: e.target.value})}
                              className="input-field w-full sm:w-24"
                              min="1"
                              max="999"
                            />
                            <button
                              onClick={() => addStep(outcome.id)}
                              disabled={!newStep.title.trim() || !newStep.estimatedMin}
                              className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 focus-visible"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Steps with Thermometer */}
                    <div className="p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
                      
                      {/* Thermometer - Mobile: top, Desktop: left */}
                      <div className="flex justify-center lg:justify-start">
                        <ThermometerDisplay
                          balance={balance}
                          totalEstimated={totalEstimated}
                        />
                      </div>

                      {/* Steps List */}
                      <div className="flex-1 space-y-4">
                        {outcome.steps.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <List size={32} className="mx-auto mb-2" />
                            <p>No steps yet. Add your first step above.</p>
                          </div>
                        ) : (
                          outcome.steps.map(step => {
                            const stepBalance = step.actualMin ? step.estimatedMin - step.actualMin : 0
                            const isActive = activeTimer?.outcomeId === outcome.id && activeTimer?.stepId === step.id
                            
                            return (
                              <div 
                                key={step.id} 
                                className={`p-4 lg:p-6 rounded-2xl border transition-all duration-300 ${
                                  step.completed ? 'bg-emerald-900/30 border-emerald-700/50' : 
                                  isActive ? 'bg-blue-900/30 border-blue-700/50' : 
                                  'bg-gray-700/50 border-gray-600'
                                }`}
                              >
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                  
                                  {/* Step Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-4 mb-3">
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        step.completed ? 'bg-emerald-400 border-emerald-400' : 
                                        isActive ? 'bg-blue-400 border-blue-400 animate-pulse' : 
                                        'border-gray-500'
                                      }`}>
                                        {step.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                                      </div>
                                      
                                      {editingStep?.outcomeId === outcome.id && editingStep?.stepId === step.id ? (
                                        <input
                                          type="text"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onKeyPress={(e) => e.key === 'Enter' && saveStepEdit()}
                                          onBlur={saveStepEdit}
                                          className="font-medium text-lg lg:text-xl bg-transparent border-b-2 border-blue-400 focus:outline-none text-white flex-1 min-w-0"
                                          autoFocus
                                          maxLength={100}
                                        />
                                      ) : (
                                        <span 
                                          className="font-medium text-white text-lg lg:text-xl cursor-pointer hover:text-blue-400 transition-colors flex-1 min-w-0 break-words"
                                          onClick={() => startEditStep(outcome.id, step.id, step.title)}
                                          title="Click to edit"
                                        >
                                          {step.title}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Step Badges */}
                                    <div className="ml-8 flex flex-wrap items-center gap-3">
                                      <span className="bg-blue-500/20 text-blue-300 font-semibold px-3 py-1 rounded-xl border border-blue-500/30 text-sm">
                                        {step.estimatedMin}m
                                      </span>
                                      
                                      {step.actualMin && (
                                        <span className="bg-gray-600/50 text-gray-300 font-semibold px-3 py-1 rounded-xl border border-gray-500 text-sm">
                                          ⏱️ {step.actualMin}m
                                        </span>
                                      )}
                                      
                                      {step.timeSpent > 0 && !step.completed && (
                                        <span className="bg-yellow-500/20 text-yellow-300 font-semibold px-3 py-1 rounded-xl border border-yellow-500/30 text-sm">
                                          ⏸️ {step.timeSpent}m
                                        </span>
                                      )}
                                      
                                      <button
                                        onClick={() => setEditingNotes(editingNotes === `${outcome.id}-${step.id}` ? null : `${outcome.id}-${step.id}`)}
                                        className="text-gray-400 hover:text-blue-400 p-2 hover:bg-blue-900/30 rounded-xl transition-all duration-200 focus-visible"
                                        title="Add note"
                                        aria-label="Add or edit step notes"
                                      >
                                        <StickyNote size={16} />
                                      </button>
                                      
                                      {step.completed && stepBalance !== 0 && (
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-semibold ${
                                          stepBalance > 0 ? 'bg-emerald-400 text-emerald-900' : 'bg-red-400 text-red-900'
                                        }`}>
                                          {stepBalance > 0 ? '💰' : '🔥'} {formatTime(stepBalance)}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Step Notes */}
                                    {editingNotes === `${outcome.id}-${step.id}` && (
                                      <div className="ml-8 mt-4 animate-slide-up">
                                        <textarea
                                          placeholder="Add notes for this step..."
                                          value={getStepNote(outcome.id, step.id)}
                                          onChange={(e) => saveStepNote(outcome.id, step.id, e.target.value)}
                                          className="input-field w-full text-sm resize-none"
                                          rows="3"
                                          maxLength={500}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Timer Controls */}
                                  <div className="flex flex-row lg:flex-col items-center gap-3">
                                    {!step.completed && (
                                      <>
                                        {isActive ? (
                                          <>
                                            <div className="bg-blue-500 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-mono text-lg lg:text-xl font-semibold shadow-lg order-1">
                                              {formatSeconds(timerSeconds)}
                                            </div>
                                            <button
                                              onClick={pauseTimer}
                                              className="bg-yellow-500 hover:bg-yellow-400 text-white p-3 lg:p-4 rounded-xl transition-all duration-200 shadow-lg focus-visible order-2"
                                              title="Pause timer"
                                            >
                                              <Pause size={18} />
                                            </button>
                                            <button
                                              onClick={addTime}
                                              disabled={timeBank < 10}
                                              className={`px-3 lg:px-4 py-3 lg:py-4 rounded-xl transition-all duration-200 shadow-lg font-semibold focus-visible order-3 ${
                                                timeBank >= 10 
                                                  ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                                                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                              }`}
                                              title={timeBank >= 10 ? "Add 10 minutes from time bank" : "Not enough time in bank"}
                                            >
                                              +10
                                            </button>
                                            <button
                                              onClick={markStepDone}
                                              className="bg-emerald-500 hover:bg-emerald-400 text-white p-3 lg:p-4 rounded-xl transition-all duration-200 shadow-lg focus-visible order-4"
                                              title="Mark as done"
                                            >
                                              <Check size={18} />
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            onClick={() => startTimer(outcome.id, step.id)}
                                            className="bg-emerald-500 hover:bg-emerald-400 text-white p-3 lg:p-4 rounded-xl transition-all duration-200 shadow-lg focus-visible"
                                            title="Start timer"
                                          >
                                            <Play size={18} />
                                          </button>
                                        )}
                                      </>
                                    )}
                                    <button
                                      onClick={() => removeStep(outcome.id, step.id)}
                                      className="text-red-400 hover:text-red-300 p-2 lg:p-3 hover:bg-red-900/30 rounded-xl transition-all duration-200 focus-visible"
                                      title="Delete step"
                                      aria-label="Delete this step"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default TimeBalanceApp
