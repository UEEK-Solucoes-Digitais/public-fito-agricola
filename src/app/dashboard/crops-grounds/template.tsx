'use client'

import ErrorBoundary from '@/document/ErrorBoundary'
import { ReactNode } from 'react'

export default function Template({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary fallbackComponent={<strong className='error-strong'>Erro crítico em solos</strong>}>
            {children}
        </ErrorBoundary>
    )
}
