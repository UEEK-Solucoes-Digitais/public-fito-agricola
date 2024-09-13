import styles from '../styles.module.scss'
import GeralInput from '@/components/inputs/GeralInput'
import Property from '@/@types/Property'
import { CropJoin, Harvest } from '@/app/dashboard/properties/types'
import IconifyIcon from '@/components/iconify/IconifyIcon'

interface IProps {
    searchOptions: any
    handleInputChange: (e: any) => void
    properties: Property[]
    harvests: Harvest[]
    data: any
    loadingCrops: boolean
    crops: CropJoin[]
    hideCrops: boolean
}

const GridSelects = ({
    searchOptions,
    handleInputChange,
    properties,
    harvests,
    data,
    loadingCrops,
    crops,
    hideCrops,
}: IProps) => {
    return (
        <div className={styles.gridSelects}>
            <GeralInput
                label=''
                name='property_id'
                variant='secondary'
                customClasses={['lessPadding']}
                defaultValue={searchOptions.property_id}
                onChange={handleInputChange}
                selectPlaceholder='Propriedade'
                icon='ph:user-square'>
                <option value={0} selected={searchOptions.property_id == 0}>
                    Propriedade
                </option>

                {properties.map((property) => (
                    <option key={property.id} value={property.id} selected={property.id == searchOptions.property_id}>
                        {property.name}
                    </option>
                ))}
            </GeralInput>

            <GeralInput
                label=''
                name='harvest_id'
                variant='secondary'
                customClasses={['lessPadding']}
                defaultValue={
                    searchOptions.harvest_id != 0
                        ? searchOptions.harvest_id
                        : data && data.last_harvest_id
                          ? data.last_harvest_id
                          : 0
                }
                onChange={handleInputChange}
                selectPlaceholder='Ano Agrícola'
                icon='solar:calendar-outline'>
                <option value={0}>Ano Agrícola</option>

                {harvests.map((harvest) => (
                    <option key={harvest.id} value={harvest.id}>
                        {harvest.name}
                    </option>
                ))}
            </GeralInput>

            {!hideCrops &&
                (loadingCrops ? (
                    <div>
                        <IconifyIcon icon='line-md:loading-loop' />
                    </div>
                ) : (
                    <GeralInput
                        label=''
                        name='crop_id'
                        variant='secondary'
                        defaultValue={searchOptions.crop_id}
                        customClasses={['lessPadding']}
                        onChange={handleInputChange}
                        selectPlaceholder='Lavoura'
                        icon='solar:leaf-linear'>
                        <option value={0} selected={searchOptions.crop_id == 0}>
                            Lavoura
                        </option>

                        {searchOptions.property_id != 0
                            ? crops
                                  .filter((crop) => crop.property_id == searchOptions.property_id)
                                  .map((crop) => (
                                      <option key={crop.id} value={crop.id} selected={crop.id == searchOptions.crop_id}>
                                          {crop.crop.name} {crop.subharvest_name ?? ''}
                                      </option>
                                  ))
                            : crops.map((crop) => (
                                  <option key={crop.id} value={crop.id} selected={crop.id == searchOptions.crop_id}>
                                      {crop.crop.name}
                                      {crop.is_subharvest ? ` - ${crop.subharvest_name}` : ''}
                                  </option>
                              ))}
                    </GeralInput>
                ))}
        </div>
    )
}

export default GridSelects
