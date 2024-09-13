import locations from '@/assets/json/locations_bolivia.json'

type StateCodes = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'

export const getStaticStatesBolivia = () => {
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

export const getStateKeyBolivia = (column: string) => {
    const stateKeys = Object.keys(locations.states)

    const foundKey = stateKeys.find((stateCode) => {
        const code = stateCode as StateCodes
        const stateName = locations.states[code]
        const stateInitial = locations.initials[code]

        return stateName == column || stateInitial == column
    })

    return foundKey || null
}

export const getStateInitialBolivia = (key: StateCodes) => {
    return locations.initials[key]
}

export const getStateBolivia = (stateId: string) => {
    return locations.states[stateId as StateCodes]
}

export const getStaticInitialsBolivia = () => {
    return locations.initials
}
