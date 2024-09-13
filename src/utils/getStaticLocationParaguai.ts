import locations from '@/assets/json/locations_paraguai.json'

type StateCodes =
    | '0'
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12'
    | '13'
    | '14'
    | '15'
    | '16'
    | '17'

export const getStaticStatesParaguai = () => {
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

export const getStateKeyParaguai = (column: string) => {
    const stateKeys = Object.keys(locations.states)

    const foundKey = stateKeys.find((stateCode) => {
        const code = stateCode as StateCodes
        const stateName = locations.states[code]
        const stateInitial = locations.initials[code]

        return stateName == column || stateInitial == column
    })

    return foundKey || null
}

export const getStateInitialParaguai = (key: StateCodes) => {
    return locations.initials[key]
}

export const getStateParaguai = (stateId: string) => {
    return locations.states[stateId as StateCodes]
}

export const getStaticInitialsParaguai = () => {
    return locations.initials
}
