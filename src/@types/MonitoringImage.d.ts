export default interface MonitoringImage {
    file: File | null
    preview: string
    isFromDatabase: boolean
    id: string
    idDatabase?: string
    loading: boolean
}
