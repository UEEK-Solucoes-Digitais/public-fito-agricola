import { HTMLAttributes } from 'react'

export type ToastState = 'loading' | 'success' | 'warning' | 'danger' | 'info' | 'hidden' | null
export type ToastPosition = 'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
    text: string
    position?: ToastPosition
    state?: ToastState
}
