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
    pests_id: string[]
    dap_begin: string
    dap_end: string
    risk: string
    open_date_begin: string
    open_date_end: string
    incidency_min: string
    incidency_max: string
    quantity_per_meter_min: string
    quantity_per_meter_max: string
    quantity_per_square_meter_min: string
    quantity_per_square_meter_max: string
    search_harvested: string
}

const PestsFilter: FC<FilterProps> = ({ currentQuery, setCurrentQuery }) => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        properties_id: [],
        culture_id: '0',
        culture_code: '',
        crops_id: [],
        harvests_id: [],
        pests_id: [],
        dap_begin: '',
        dap_end: '',
        risk: '',
        open_date_begin: '',
        open_date_end: '',
        incidency_min: '',
        incidency_max: '',
        quantity_per_meter_min: '',
        quantity_per_meter_max: '',
        quantity_per_square_meter_min: '',
        quantity_per_square_meter_max: '',
        search_harvested: '1',
    })

    const { admin } = useAdmin()
    const { data, isLoading } = useSWR(`/api/reports/get-filters-options/${admin.id}?with=pests`, getFetch)

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
                const key = item.split('=')[0] as keyof FilterOptions
                const value = item.split('=')[1]

                if (key && value !== undefined && value !== null) {
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
                    } else if (key == 'pests_id') {
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

            <div className={styles.filterGroup}>
                <GeralInput name='pests_id' label='Pragas' type='select' onChange={handleInputArrayChange}>
                    <option value='0'>Selecione</option>

                    {data &&
                        (filterOptions.culture_id !== '0'
                            ? data.cultures
                                  .filter((item: any) => item.id == parseFloat(filterOptions.culture_id.toString()))
                                  .map((item: any) =>
                                      item.pests.map((defensive: any) => (
                                          <option key={defensive.id} value={defensive.id}>
                                              {defensive.name}
                                          </option>
                                      )),
                                  )
                            : data.pests.map((pest: Crop) => (
                                  <option key={pest.id} value={pest.id}>
                                      {pest.name}
                                  </option>
                              )))}
                </GeralInput>

                <div className={styles.filterOptions}>
                    {data &&
                        data.pests.map(
                            (pest: any) =>
                                filterOptions.pests_id.includes(pest.id.toString()) && (
                                    <div key={pest.id} className={styles.filterOptionItem}>
                                        {pest.name}

                                        <button onClick={() => removeItem('pests_id', pest.id.toString())}>
                                            <IconifyIcon icon='ph:x' />
                                        </button>
                                    </div>
                                ),
                        )}
                </div>
            </div>

            <GeralInput
                label='Data inicial'
                name='open_date_begin'
                type='date'
                defaultValue={filterOptions.open_date_begin}
                max={filterOptions.open_date_end}
                onChange={handleInputChange}
            />
            <GeralInput
                label='Data final'
                name='open_date_end'
                type='date'
                defaultValue={filterOptions.open_date_end}
                max={getActualDate()}
                onChange={handleInputChange}
            />

            <div className={styles.filterGroup}>
                <GeralInput
                    name='risk'
                    label='Nível de risco'
                    defaultValue={filterOptions.risk}
                    type='select'
                    onChange={handleInputArrayChange}>
                    <option value='0'>Selecione</option>
                    <option value='1'>Sem risco</option>
                    <option value='2'>Atenção</option>
                    <option value='3'>Urgência</option>
                </GeralInput>

                <div className={styles.filterOptions}>
                    {[1, 2, 3].map(
                        (risk: number) =>
                            filterOptions.risk.includes(risk.toString()) && (
                                <div key={risk} className={styles.filterOptionItem}>
                                    {risk == 1 ? 'Sem risco' : risk == 2 ? 'Atenção' : 'Urgência'}

                                    <button onClick={() => removeItem('risk', risk.toString())}>
                                        <IconifyIcon icon='ph:x' />
                                    </button>
                                </div>
                            ),
                    )}
                </div>
            </div>

            <div className={styles.filterGroup}>
                <GeralInput
                    label='Incidência mínima (%)'
                    placeholder='00,00'
                    name='incidency_min'
                    maskVariant='price'
                    defaultValue={filterOptions.incidency_min}
                    onChange={handleInputChange}
                />
            </div>

            <div className={styles.filterGroup}>
                <GeralInput
                    label='Incidência máxima (%)'
                    placeholder='00,00'
                    name='incidency_max'
                    maskVariant='price'
                    defaultValue={filterOptions.incidency_max}
                    onChange={handleInputChange}
                />
            </div>
            <div className={styles.filterGroup}>
                <GeralInput
                    label='Metro linear (mínimo)'
                    placeholder='00,00'
                    name='quantity_per_meter_min'
                    maskVariant='price'
                    defaultValue={filterOptions.quantity_per_meter_min}
                    onChange={handleInputChange}
                />
            </div>
            <div className={styles.filterGroup}>
                <GeralInput
                    label='Metro linear (máximo)'
                    placeholder='00,00'
                    name='quantity_per_meter_max'
                    maskVariant='price'
                    defaultValue={filterOptions.quantity_per_meter_max}
                    onChange={handleInputChange}
                />
            </div>
            <div className={styles.filterGroup}>
                <GeralInput
                    label='Quantidade/m² (mínimo)'
                    placeholder='00,00'
                    name='quantity_per_square_meter_min'
                    maskVariant='price'
                    defaultValue={filterOptions.quantity_per_square_meter_min}
                    onChange={handleInputChange}
                />
            </div>
            <div className={styles.filterGroup}>
                <GeralInput
                    label='Quantidade/m² (máximo)'
                    placeholder='00,00'
                    name='quantity_per_square_meter_max'
                    maskVariant='price'
                    defaultValue={filterOptions.quantity_per_square_meter_max}
                    onChange={handleInputChange}
                />
            </div>
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

export default PestsFilter
