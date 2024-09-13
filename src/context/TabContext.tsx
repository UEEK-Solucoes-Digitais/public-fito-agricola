import React, { ReactNode, createContext, useContext, useState } from 'react'

interface TabContextProps {
    selectedTab: any
    setSelectedTab: React.Dispatch<React.SetStateAction<any>>
}

const TabContext = createContext<TabContextProps | undefined>(undefined)

interface TabProviderProps {
    children: ReactNode
}

export const useTab = () => {
    const context = useContext(TabContext)
    if (!context) {
        throw new Error('useTab deve ser usado dentro de um TabProvider')
    }
    return context
}

export const TabProvider = ({ children }: TabProviderProps) => {
    const [selectedTab, setSelectedTab] = useState(null)

    return <TabContext.Provider value={{ selectedTab, setSelectedTab }}>{children}</TabContext.Provider>
}
