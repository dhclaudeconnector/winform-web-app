'use client'

import { useState, useEffect } from 'react'
import { Download, AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { updateService, UpdateInfo, Migration, UpdateProgress } from '@/lib/api/updateService'

export function UpdateManager() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [pendingManual, setPendingManual] = useState<Migration[]>([])
  const [approvedMigrations, setApprovedMigrations] = useState<Set<string>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const [progress, setProgress] = useState<UpdateProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkForUpdates()
    loadPendingMigrations()
  }, [])

  useEffect(() => {
    if (isUpdating) {
      const interval = setInterval(async () => {
        const prog = await updateService.getProgress()
        setProgress(prog)

        if (prog.status === 'completed' || prog.status === 'failed' || prog.status === 'rolled_back') {
          setIsUpdating(false)
          clearInterval(interval)

          if (prog.status === 'completed') {
            setTimeout(() => window.location.reload(), 2000)
          }
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isUpdating])

  const checkForUpdates = async () => {
    setIsChecking(true)
    setError(null)
    try {
      const info = await updateService.checkForUpdates()
      setUpdateInfo(info)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsChecking(false)
    }
  }

  const loadPendingMigrations = async () => {
    try {
      const { pendingManual } = await updateService.getPendingMigrations()
      setPendingManual(pendingManual)
    } catch (err: any) {
      console.error('Failed to load migrations:', err)
    }
  }

  const toggleMigrationApproval = (version: string) => {
    setApprovedMigrations(prev => {
      const next = new Set(prev)
      if (next.has(version)) {
        next.delete(version)
      } else {
        next.add(version)
      }
      return next
    })
  }

  const handleUpdate = async () => {
    if (!updateInfo?.releaseUrl || !updateInfo?.latest) return

    // Approve all manual migrations first
    try {
      for (const version of approvedMigrations) {
        await updateService.approveMigration(version)
      }

      // Start update
      setIsUpdating(true)
      setError(null)
      await updateService.applyUpdate(
        updateInfo.releaseUrl,
        updateInfo.latest,
        updateInfo.checksum
      )
    } catch (err: any) {
      setError(err.message)
      setIsUpdating(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      case 'rolled_back': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default: return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    }
  }

  if (isUpdating && progress) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon(progress.status)}
            <h2 className="text-xl font-semibold">Updating System</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{progress.message}</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>

            {progress.status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800 text-sm">{progress.message}</p>
              </div>
            )}

            {progress.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-green-800 text-sm">Update completed! Reloading...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Update</h1>
        <button
          onClick={checkForUpdates}
          disabled={isChecking}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          Check for Updates
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {updateInfo?.hasUpdate ? (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="flex items-start gap-4">
            <Download className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">
                New Version Available: v{updateInfo.latest}
              </h2>
              <p className="text-gray-600">Current version: v{updateInfo.current}</p>
            </div>
          </div>

          {updateInfo.changelog && updateInfo.changelog.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">What's New:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {updateInfo.changelog.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {updateInfo.migrations && updateInfo.migrations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Database Migrations:</h3>
              <div className="space-y-2">
                {updateInfo.migrations.map((migration) => (
                  <div
                    key={migration.version}
                    className={`p-3 rounded border ${
                      migration.type === 'auto' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(migration.risk)}`}>
                          {migration.risk.toUpperCase()}
                        </span>
                        <span className="font-medium">{migration.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {migration.type === 'auto' ? (
                          <span className="text-xs text-green-600 font-medium">AUTO</span>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={approvedMigrations.has(migration.version)}
                              onChange={() => toggleMigrationApproval(migration.version)}
                              className="w-4 h-4"
                            />
                            <span className="text-xs font-medium">Approve</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleUpdate}
              disabled={
                isUpdating ||
                (pendingManual.length > 0 && approvedMigrations.size < pendingManual.length)
              }
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Download className="w-5 h-5" />
              Update Now
            </button>
          </div>

          {pendingManual.length > 0 && approvedMigrations.size < pendingManual.length && (
            <p className="text-sm text-yellow-600 text-center">
              ⚠️ Please approve all manual migrations before updating
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold mb-2">System is Up to Date</h2>
          <p className="text-gray-600">
            Current version: v{updateInfo?.current || '1.0.0'}
          </p>
        </div>
      )}
    </div>
  )
}
