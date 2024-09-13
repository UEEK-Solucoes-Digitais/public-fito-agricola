export default interface AdminProps {
    id: number
    name: string
    access_level: number
    level?: any
    profile_picture?: string
    is_super_user?: number
    currency_id?: number
    access_ma?: boolean
}
