import locations from '@/assets/json/locations.json'

type StateCodes =
    | '11'
    | '12'
    | '13'
    | '14'
    | '15'
    | '16'
    | '17'
    | '21'
    | '22'
    | '23'
    | '24'
    | '25'
    | '26'
    | '27'
    | '28'
    | '29'
    | '31'
    | '32'
    | '33'
    | '35'
    | '41'
    | '42'
    | '43'
    | '50'
    | '51'
    | '52'
    | '53'

export const getStaticStates = () => {
    const countries = Object.keys(locations.states).map((key) => {
        const stateCode = key as StateCodes
        const state = locations.states[stateCode]
        return {
            id: stateCode,
            name: state,
            initial: locations.initials[stateCode],
        }
    })

    // retornar ordenado pelo nome
    return countries.sort((a, b) => (a.name > b.name ? 1 : -1))
}

export const getStateKey = (column: string) => {
    const stateKeys = Object.keys(locations.states)

    const foundKey = stateKeys.find((stateCode) => {
        const code = stateCode as StateCodes
        const stateName = locations.states[code]
        const stateInitial = locations.initials[code]

        return stateName == column || stateInitial == column
    })

    return foundKey || null
}

export const getStateInitial = (key: StateCodes) => {
    return locations.initials[key]
}

export const getState = (stateId: string) => {
    return locations.states[stateId as StateCodes]
}

export const getStaticCities = (stateId: string | number | null) => {
    if (!stateId) {
        return null
    }
    return locations.cities.filter((city) => city.state_id == stateId)
}

export const getStaticInitials = () => {
    return locations.initials
}
