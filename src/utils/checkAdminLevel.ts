import { useAdmin } from '@/context/AdminContext'

export const checkAdminLevel = (level: string) => {
    const { admin } = useAdmin()
    const levels = !admin ? [] : admin.level.toString().split(',')

    return levels.includes(level)
}
