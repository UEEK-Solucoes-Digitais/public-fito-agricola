export default interface ContentListProps {
    contents: ContentProps[]
    newest: ContentProps[]
    courses: ContentProps[]
    saved_contents: ContentProps[]
    keep_watching: ContentProps[]
    most_viewed: ContentProps[]
    all_contents: ContentProps[]
    content_categories: ContentCategoryProps[]
    access_enabled: boolean
}
