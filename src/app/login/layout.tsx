import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
    title: 'Login - Fito Agrícola',
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return children
}
