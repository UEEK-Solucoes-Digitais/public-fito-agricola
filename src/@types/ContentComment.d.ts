import type AdminProps from './Admin'

export default interface IContentComment {
    id: number
    admin_id: number
    content_id: number
    answer_id: number
    text: string
    is_liked: number
    likes_count: number
    answers: this[]
    created_at: string
    admin: AdminProps
}
