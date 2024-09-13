import { ToastProps } from '@/components/notifications/types'
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

interface NotificationContextProps {
    toastData: ToastProps
    setToast: (data: ToastProps) => void
    hideToast: () => void
    isVisible: boolean
}

const NotificationContext = createContext<NotificationContextProps>({
    toastData: { state: 'hidden', text: '', position: 'bottom' },
    setToast: () => {},
    hideToast: () => {},
    isVisible: false,
})

export const useNotification = () => useContext(NotificationContext)

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toastData, setToastData] = useState<ToastProps>({ state: 'hidden', text: '', position: 'bottom' })
    const [isVisible, setIsVisible] = useState(false)
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

    const hideToast = useCallback(() => {
        setIsVisible(false)
        setToastData({ state: 'hidden', text: '', position: 'bottom' })
        if (timer) {
            clearTimeout(timer)
        }
    }, [timer])

    const setToast = useCallback(
        (data: ToastProps) => {
            hideToast()

            setTimeout(() => {
                setToastData({ ...data, state: data.state || 'info' })
                setIsVisible(true)

                if (data.state !== 'loading') {
                    const newTimer = setTimeout(() => {
                        hideToast()
                    }, 4000)

                    setTimer(newTimer)
                }
            }, 100)
        },
        [timer, hideToast],
    )

    useEffect(() => {
        return () => {
            if (timer) {
                clearTimeout(timer)
            }
        }
    }, [timer])

    return (
        <NotificationContext.Provider value={{ toastData, setToast, hideToast, isVisible }}>
            {children}
        </NotificationContext.Provider>
    )
}
