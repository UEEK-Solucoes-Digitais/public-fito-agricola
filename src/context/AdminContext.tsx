import AdminProps from '@/@types/Admin'
import getFetch from '@/utils/getFetch'
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react'
import useSWR from 'swr'

interface AdminContextProps {
    admin: AdminProps
    setAdmin: Dispatch<SetStateAction<any>>
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined)

interface AdminProviderProps {
    children: ReactNode
}

export function useAdmin() {
    const context = useContext(AdminContext)
    if (!context) {
        throw new Error('useAdmin deve ser usado dentro de um AdminProvider')
    }
    return context
}

export function AdminProvider({ children }: AdminProviderProps) {
    const storedAdmin = typeof window !== 'undefined' ? localStorage.getItem('admin') : null
    const [admin, setAdmin] = useState<AdminProps>(
        validateAdmin(storedAdmin) ? JSON.parse(storedAdmin!) : { name: '', id: 0, level: '' },
    )

    const { data } = useSWR(admin.id !== 0 ? `/api/user/read/${admin.id}` : null, getFetch, {
        refreshInterval: 5000, // Atualiza a cada 30 segundos
    })

    useEffect(() => {
        if (data) {
            setAdmin(data.admin)
            localStorage.setItem('admin', JSON.stringify(data.admin))
        }
    }, [data])

    const value = {
        admin,
        setAdmin,
    }

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

const validateAdmin = (storedAdmin: any) => {
    if (storedAdmin && storedAdmin !== undefined && storedAdmin !== 'null' && storedAdmin !== 'undefined') {
        return true
    }

    return false
}
