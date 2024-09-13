export default interface ContentBlockProps {
    id: number
    content_id?: number
    type: number // 1 => texto // 2 => imagem // 3 => galeria // 4 => vídeo (youtube ou vimeo) // 5 => audio (soundcloud ou spotify)
    content: string
    images?: any
}
