import { useState, useEffect, useCallback } from 'react'
import { unwrap } from '../lib/api.js'

export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(unwrap(result))
    } catch (e) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, reload: load }
}

export function useApiMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const mutate = useCallback(async (fn, onSuccess) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const result = await fn()
      setSuccess(true)
      if (onSuccess) onSuccess(result)
      return result
    } catch (e) {
      setError(e.message || 'Request failed')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setSuccess(false)
  }, [])

  return { loading, error, success, mutate, reset }
}
