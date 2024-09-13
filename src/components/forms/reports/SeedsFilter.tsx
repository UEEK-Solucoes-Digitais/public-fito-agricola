import Property from '@/@types/Property'
import Loading from '@/app/dashboard/loading'
import { Crop } from '@/app/dashboard/properties/types'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import { useAdmin } from '@/context/AdminContext'
import { getActualDate } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { ChangeEvent, FC, useEffect, useState } from 'react'
import useSWR from 'swr'
import styles from './styles.module.scss'
import { FilterProps } from './types'

interface FilterOptions {
    properties_id: string[]
    culture_id: string
    culture_code: string
    crops_id: string[]
    harvests_id: string[]
    dap_begin: string
    dap_end: string
    min_population: string
    max_population: string
    min_emergency: string
    max_emergency: string
    search_harvested: string
}

const SeedFilter: FC<FilterProps> = ({ currentQuery, setCurrentQuery }) => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        properties_id: [],
        culture_id: '0',
        culture_code: '',
        crops_id: [],
        harvests_id: [],
        dap_begin: '',
        dap_end: '',
        min_population: '',
        max_population: '',
        min_emergency: '',
        max_emergency: '',
        search_harvested: '1',
    })

    const { admin } = useAdmin()
    const { data, isLoading } = useSWR(`/api/reports/get-filters-options/${admin.id}`, getFetch)

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target
        if (name !== 'search_harvested') {
            setFilterOptions({ ...filterOptions, [name]: value })
        } else {
            setFilterOptions({ ...filterOptions, [name]: filterOptions.search_harvested == '1' ? '0' : '1' })
        }
    }

    const handleInputArrayChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = event.target

        if (value !== '0') {
            const values = filterOptions[name as keyof FilterOptions]

            if (!values.includes(value)) {
                setFilterOptions({ ...filterOptions, [name]: [...values, value.toString()] })
            }
        }
    }

    useEffect(() => {
        let query = ''

        Object.keys(filterOptions).forEach((key: string) => {
            const item = filterOptions[key as keyof FilterOptions]

            if (item) {
                if (Array.isArray(item)) {
                    if (item.length > 0) {
                        query += `&${key}=${item.join(',')}`
                    }
                } else {
                    if (item !== '0' || (item == '0' && key == 'search_harvested')) {
                        query += `&${key}=${item}`
                    }
                }
            }
        })

        setCurrentQuery(query.replace('&', '?'))
    }, [filterOptions])

    const removeItem = (name: string, item: string) => {
        const values = filterOptions[name as keyof FilterOptions]

        if (Array.isArray(values)) {
            const index = values.indexOf(item.toString())

            if (index > -1) {
                values.splice(index, 1)
            }
        }

        setFilterOptions({
            ...filterOptions,
            [name]: values,
        })
    }

    useEffect(() => {
        if (currentQuery) {
            const query = currentQuery.replace('?', '')
            const queryArray = query.split('&')

            queryArray.forEach((item: string) => {
                const key = item.split('=')[0]
                const value = item.split('=')[1]

                if (key && value !== undefined && value != null) {
                    if (key == 'properties_id') {
                        setFilterOptions({
                            ...filterOptions,
                            [key]: value.split(','),
                        })
                    } else if (key == 'crops_id') {
                        setFilterOptions({
                            ...filterOptions,
                            [key]: value.split(','),
                        })
                    } else if (key == 'harvests_id') {
                        setFilterOptions({
                            ...filterOptions,
                            [key]: value.split(','),
                        })
                    } else {
                        setFilterOptions({
                            ...filterOptions,
                            [key]: value,
                        })
                    }
                }
            })
        }
    }, [])

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <div className={styles.filterGroup}>
                <GeralInput name='properties_id' label='Propriedade' type='select' onChange={handleInputArrayChange}>
                    <option value='0'>Selecione</option>

                    {data &&
                        data.properties.map((property: Property) => (
                            <option key={property.id} value={property.id}>
                                {property.name}
                            </option>
                        ))}
                </GeralInput>

                <div className={styles.filterOptions}>
                    {data &&
                        data.properties.map(
                            (property: Property) =>
                                filterOptions.properties_id.includes(property.id.toString()) && (
                                    <div key={property.id} className={styles.filterOptionItem}>
                                        {property.name}

                                        <button onClick={() => removeItem('properties_id', property.id.toString())}>
                                            <IconifyIcon icon='ph:x' />
                                        </button>
                                    </div>
                                ),
                        )}
                </div>
            </div>

            <div className={styles.filterGroup}>
                <GeralInput name='crops_id' label='Lavoura' type='select' onChange={handleInputArrayChange}>
                    <option value='0'>Selecione</option>

                    {data &&
                        data.crops.map(
                            (crop: Crop) =>
                                (filterOptions.properties_id.length == 0 ||
                                    (crop.property_id &&
                                        filterOptions.properties_id.includes(crop.property_id.toString()))) && (
                                    <option key={crop.id} value={crop.id}>
                                        {crop.name}
                                    </option>
                                ),
                        )}
                </GeralInput>

                <div className={styles.filterOptions}>
                    {data &&
                        data.crops.map(
                            (crop: Crop) =>
                                filterOptions.crops_id.includes(crop.id.toString()) && (
                                    <div key={crop.id} className={styles.filterOptionItem}>
                                        {crop.name}

                                        <button onClick={() => removeItem('crops_id', crop.id.toString())}>
                                            <IconifyIcon icon='ph:x' />
                                        </button>
                                    </div>
                                ),
                        )}
                </div>
            </div>

            <div className={styles.filterGroup}>
                <GeralInput name='harvests_id' label='Ano agrícola' type='select' onChange={handleInputArrayChange}>
                    <option value='0'>Selecione</option>

                    {data &&
                        data.harvests.map((harvest: any) => (
                            <option key={harvest.id} value={harvest.id}>
                                {harvest.name}
                            </option>
                        ))}
                </GeralInput>

                <div className={styles.filterOptions}>
                    {data &&
                        data.harvests.map(
                            (harvest: any) =>
                                filterOptions.harvests_id.includes(harvest.id.toString()) && (
                                    <div key={harvest.id} className={styles.filterOptionItem}>
                                        {harvest.name}

                                        <button onClick={() => removeItem('harvests_id', harvest.id.toString())}>
                                            <IconifyIcon icon='ph:x' />
                                        </button>
                                    </div>
                                ),
                        )}
                </div>
            </div>

            <GeralInput
                name='culture_id'
                defaultValue={filterOptions.culture_id}
                label='Cultura'
                type='select'
                onChange={handleInputChange}>
                <option value='0'>Selecione</option>

                {data &&
                    data.cultures.map((culture: any) => (
                        <option key={culture.id} value={culture.id}>
                            {culture.name}
                        </option>
                    ))}
            </GeralInput>

            <GeralInput
                name='culture_code'
                defaultValue={filterOptions.culture_code}
                label='Cultivar'
                type='select'
                onChange={handleInputChange}>
                <option value='0'>Selecione</option>

                {data &&
                    data.cultures
                        .filter((item: any) => item.id == parseFloat(filterOptions.culture_id.toString()))
                        .map((item: any) =>
                            item.extra_column
                                ?.split(',')
                                .sort()
                                .map((variety: string) => (
                                    <option key={`${item.id}-${variety}`} value={variety}>
                                        {variety}
                                    </option>
                                )),
                        )}
            </GeralInput>

            <div className={styles.plantLabels}>
                <GeralInput
                    label=''
                    name='dap_begin'
                    type='date'
                    defaultValue={filterOptions.dap_begin}
                    max={filterOptions.dap_end}
                    onChange={handleInputChange}
                />
                <GeralInput
                    label=''
                    name='dap_end'
                    type='date'
                    defaultValue={filterOptions.dap_end}
                    max={getActualDate()}
                    onChange={handleInputChange}
                />
            </div>

            <GeralInput
                label='População (min)'
                name='min_population'
                maskVariant='price'
                placeholder='Digite aqui'
                defaultValue={filterOptions.min_population}
                onChange={handleInputChange}
            />
            <GeralInput
                label='População (max)'
                name='max_population'
                maskVariant='price'
                placeholder='Digite aqui'
                defaultValue={filterOptions.max_population}
                onChange={handleInputChange}
            />

            <GeralInput
                label='% de emergência (min)'
                name='min_emergency'
                maskVariant='price'
                placeholder='Digite aqui'
                defaultValue={filterOptions.min_emergency}
                onChange={handleInputChange}
            />
            <GeralInput
                label='% de emergência (max)'
                name='max_emergency'
                maskVariant='price'
                placeholder='Digite aqui'
                defaultValue={filterOptions.max_emergency}
                onChange={handleInputChange}
            />

            <GeralInput
                variant='switch'
                value='1'
                name='search_harvested'
                type='checkbox'
                label='Lavouras colhidas'
                on={1}
                checked={filterOptions.search_harvested == '1'}
                onChange={handleInputChange}
            />
        </>
    )
}

export default SeedFilter
