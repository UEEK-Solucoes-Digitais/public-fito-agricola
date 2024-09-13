export default interface InterferenceFactorItemProps {
    id: number
    name: string
    scientific_name: string
    observation?: string
    type: 1 | 2 | 3 // * 1 => weeds // 2 => diseases // 3 => pests
}
