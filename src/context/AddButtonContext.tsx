import React, { ReactNode, createContext, useContext, useState } from 'react'

interface AddButtonContextProps {
    actionAddButton: any
    setActionAddButton: React.Dispatch<React.SetStateAction<any>>
}

const AddButtonContext = createContext<AddButtonContextProps | undefined>(undefined)

interface AddButtonProviderProps {
    children: ReactNode
}

export const useAddButton = () => {
    const context = useContext(AddButtonContext)
    if (!context) {
        throw new Error('useAddButton deve ser usado dentro de um AddButtonProvider')
    }
    return context
}

export const AddButtonProvider = ({ children }: AddButtonProviderProps) => {
    const [actionAddButton, setActionAddButton] = useState(null)

    return (
        <AddButtonContext.Provider value={{ actionAddButton, setActionAddButton }}>
            {children}
        </AddButtonContext.Provider>
    )
}
