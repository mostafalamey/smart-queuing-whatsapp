'use client'

import { useAppToast } from '@/hooks/useAppToast'

export const ToastDemo = () => {
  const { showSuccess, showError, showWarning, showInfo, showPersistent } = useAppToast()

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">🎉 Toast Demo</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={() => showSuccess('Success!', 'Your action was completed successfully.')}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
        >
          Success Toast
        </button>
        
        <button
          onClick={() => showError('Error!', 'Something went wrong. Please try again.')}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
        >
          Error Toast
        </button>
        
        <button
          onClick={() => showWarning('Warning!', 'Please check your input before proceeding.')}
          className="px-4 py-2 bg-warning-500 text-white rounded-lg hover:bg-warning-600 transition-colors duration-150 text-sm font-medium"
        >
          Warning Toast
        </button>
        
        <button
          onClick={() => showInfo('Info', 'Here is some helpful information for you.')}
          className="px-4 py-2 bg-info-500 text-white rounded-lg hover:bg-info-600 transition-colors duration-150 text-sm font-medium"
        >
          Info Toast
        </button>
        
        <button
          onClick={() => showSuccess(
            'With Action!', 
            'This toast has an action button.',
            {
              label: 'Click Me',
              onClick: () => alert('Action clicked!')
            }
          )}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-150 text-sm font-medium"
        >
          With Action
        </button>
        
        <button
          onClick={() => showPersistent(
            'info',
            'Persistent Toast',
            'This toast will not auto-dismiss. Click the X to close.',
          )}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          Persistent
        </button>
      </div>
    </div>
  )
}
