import type Admin from './Admin'
import type Category from './ContentCategory'
import type IContentComment from './ContentComment'

export default interface ContentProps {
    id: number
    title: string
    highlight_category_id: number | null
    categories_ids: string[]
    admin_id?: number
    admin?: Admin
    date?: string // usar created_at caso vázio
    text: string
    created_at?: string
    content_type?: number
    status: 0 | 1 | 2 // 0 => excluído // 1 => publicado // 2 => rascunho
    image?: File | string | null
    course_cover?: File | string | null
    most_watched_cover?: File | string | null
    url?: string
    is_course: number
    cities: string[] | null
    states: string[] | null
    countries: string[] | null
    access_level: string[] | null
    admins_ids: string[] | null
    properties_ids: string[] | null
    is_liked: number
    is_saved: number
    is_watching: number
    is_available: number
    count_finished: number
    count_finished_user: number
    count_videos: number
    watched_seconds: string
    video_seconds: string
    blocks: any
    comments: IContentComment[]
    videos?: any
    current_video?: number
    position?: number
}
