'use client'

import React, { ChangeEvent, FC, Suspense, useState } from 'react'

import GeralButton from '@/components/buttons/GeralButton'
import GeralInput from '@/components/inputs/GeralInput'

import styles from './styles.module.scss'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import Property from '@/@types/Property'
import { Crop, Harvest } from '@/app/dashboard/properties/types'

interface FormProps {
    properties: Property[]
    crops: Crop[]
    harvests: Harvest[]
    customClasses?: string[]
    isInline?: boolean
}

const Form: FC<FormProps> = ({ properties = [], crops = [], harvests = [], customClasses = [], isInline = false }) => {
    const [selectedOptions, setSelectedOptions] = useState({
        property_id: 0,
        crop_id: 0,
        harvest_id: 0,
    })

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedOptions({
            ...selectedOptions,
            [e.target.name]: e.target.value,
        })
    }

    return (
        <div className={`${styles.form} ${customClasses ? customClasses?.join(' ') : ''}`}>
            <Suspense fallback={<ElementSkeleton />}>
                <GeralInput
                    label='Propriedade'
                    name='property_id'
                    variant={isInline ? 'inline' : 'secondary'}
                    defaultValue={selectedOptions.property_id}
                    onChange={handleInputChange}>
                    <option value={0}>Selecione a propriedade</option>

                    {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                            {property.name}
                        </option>
                    ))}
                </GeralInput>

                <GeralInput
                    label='Ano Agrícola'
                    name='harvest_id'
                    variant={isInline ? 'inline' : 'secondary'}
                    defaultValue={selectedOptions.crop_id}
                    onChange={handleInputChange}>
                    <option value={0}>Selecione o ano agrícola</option>

                    {harvests.map((harvest) => (
                        <option key={harvest.id} value={harvest.id}>
                            {harvest.name}
                        </option>
                    ))}
                </GeralInput>

                <GeralInput
                    label='Lavoura'
                    name='crop_id'
                    variant={isInline ? 'inline' : 'secondary'}
                    defaultValue={selectedOptions.crop_id}
                    onChange={handleInputChange}>
                    <option value={0}>Selecione a lavoura</option>

                    {selectedOptions.property_id != 0
                        ? crops
                              .filter((crop) => crop.property_id == selectedOptions.property_id)
                              .map((crop) => (
                                  <option key={crop.id} value={crop.id}>
                                      {crop.name}
                                  </option>
                              ))
                        : crops.map((crop) => (
                              <option key={crop.id} value={crop.id}>
                                  {crop.name}
                              </option>
                          ))}
                </GeralInput>

                <GeralButton
                    variant='primary'
                    href={`/dashboard/busca?propriedade=${selectedOptions.property_id}&safra=${selectedOptions.harvest_id}&lavoura=${selectedOptions.crop_id}`}>
                    Localizar Informações
                </GeralButton>
            </Suspense>
        </div>
    )
}

Form.displayName = 'Dashboard Form'

export default Form
