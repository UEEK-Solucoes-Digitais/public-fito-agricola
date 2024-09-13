import React, { ReactNode, createContext, useContext, useState } from 'react'

interface SearchPropertyContextProps {
    searchOptions: any
    setSearchOptions: React.Dispatch<React.SetStateAction<any>>
}

const SearchPropertyContext = createContext<SearchPropertyContextProps | undefined>(undefined)

interface SearchPropertyProviderProps {
    children: ReactNode
}

export const useSearchProperty = () => {
    const context = useContext(SearchPropertyContext)
    if (!context) {
        throw new Error('useSearchProperty deve ser usado dentro de um SearchPropertyProvider')
    }
    return context
}

export const SearchPropertyProvider = ({ children }: SearchPropertyProviderProps) => {
    const [searchOptions, setSearchOptions] = useState({
        property_id: 0,
        crop_id: 0,
        harvest_id: 0,
    })

    return (
        <SearchPropertyContext.Provider value={{ searchOptions, setSearchOptions }}>
            {children}
        </SearchPropertyContext.Provider>
    )
}
