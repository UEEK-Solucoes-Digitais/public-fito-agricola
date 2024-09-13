import React, { ReactNode, createContext, useContext, useState } from 'react'

interface SubTabContextProps {
    selectedSubTab: any
    setSelectedSubTab: React.Dispatch<React.SetStateAction<any>>
}

const SubTabContext = createContext<SubTabContextProps | undefined>(undefined)

interface SubTabProviderProps {
    children: ReactNode
}

export const useSubTab = () => {
    const context = useContext(SubTabContext)
    if (!context) {
        throw new Error('useSubTab deve ser usado dentro de um SubTabProvider')
    }
    return context
}

export const SubTabProvider = ({ children }: SubTabProviderProps) => {
    const [selectedSubTab, setSelectedSubTab] = useState(null)

    return <SubTabContext.Provider value={{ selectedSubTab, setSelectedSubTab }}>{children}</SubTabContext.Provider>
}
