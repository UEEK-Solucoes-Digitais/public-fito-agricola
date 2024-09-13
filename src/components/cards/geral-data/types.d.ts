export default interface props {
    type: 'big-data' | 'collection'
    title?: string
    value?: string | number
    data?: itemProp[]
}

export interface itemProp {
    icon: string
    title: string
    value: string
}
