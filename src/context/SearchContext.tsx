import React, { ReactNode, createContext, useContext, useState } from 'react'

interface SearchContextProps {
    searchPage: any
    setSearchPage: React.Dispatch<React.SetStateAction<any>>
    categoryPage: number
    setCategoryPage: React.Dispatch<React.SetStateAction<number>>
}

const SearchContext = createContext<SearchContextProps | undefined>(undefined)

interface SearchProviderProps {
    children: ReactNode
}

export const useSearch = () => {
    const context = useContext(SearchContext)
    if (!context) {
        throw new Error('useSearch deve ser usado dentro de um SearchProvider')
    }
    return context
}

export const SearchProvider = ({ children }: SearchProviderProps) => {
    const [searchPage, setSearchPage] = useState(null)
    const [categoryPage, setCategoryPage] = useState(0)

    return (
        <SearchContext.Provider value={{ searchPage, setSearchPage, categoryPage, setCategoryPage }}>
            {children}
        </SearchContext.Provider>
    )
}
