import React from 'react'

import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Conteúdos - Fito Agrícola',
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return children
}

export default Layout
