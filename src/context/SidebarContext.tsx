import React, { ReactNode, createContext, useContext, useState } from 'react'

interface SidebarContextProps {
    sidebarActive: boolean
    setSidebarActive: React.Dispatch<React.SetStateAction<any>>
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

interface SibebarProviderProps {
    children: ReactNode
}

export const useSidebarContext = () => {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error('useSidebarContext deve ser usado dentro de um TabProvider')
    }
    return context
}

export const SidebarContextProvider = ({ children }: SibebarProviderProps) => {
    const [sidebarActive, setSidebarActive] = useState(false)

    return <SidebarContext.Provider value={{ sidebarActive, setSidebarActive }}>{children}</SidebarContext.Provider>
}
