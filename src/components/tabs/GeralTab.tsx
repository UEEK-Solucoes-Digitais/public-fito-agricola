import React, { HTMLAttributes, MouseEvent } from 'react'
import 'swiper/css'
import 'swiper/css/free-mode'
import { FreeMode } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import GeralButton from '../buttons/GeralButton'
import IconifyIcon from '../iconify/IconifyIcon'
import styles from './styles.module.scss'

type TabVariant = 'default' | 'buttons'

interface Header {
    name: number | string
    id: string
    icon?: string
    disabled?: boolean
}

interface TableProps extends HTMLAttributes<HTMLDivElement> {
    headers: Header[]
    selectedId: number | string | null
    onButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void
    variant?: TabVariant
    customClasses?: string[]
    noBorder?: boolean
    isSwiper?: boolean
    isDropdown?: boolean
}

const GeralTab: React.FC<TableProps> = ({
    customClasses,
    headers,
    selectedId,
    variant = 'default',
    onButtonClick,
    noBorder = false,
    isSwiper = false,
    isDropdown = false,
}) => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0

    const [isOpenTab, setIsOpenTab] = React.useState(false)

    return screenWidth > 1200 || (!isDropdown && screenWidth <= 1200) ? (
        isSwiper ? (
            <Swiper
                slidesPerView={'auto'}
                spaceBetween={10}
                modules={[FreeMode]}
                freeMode
                className={`${styles.tabs} ${variant == 'buttons' ? styles.geralButtonTab : ''} ${
                    noBorder ? styles.noBorder : ''
                }`}>
                {headers.map((header: Header) => (
                    <SwiperSlide key={header.id} data-disabled={header.disabled}>
                        {variant == 'buttons' ? (
                            <GeralButton
                                onClick={onButtonClick}
                                data-id={header.id}
                                smaller
                                variant='gray'
                                customClasses={[
                                    styles.geralButton,
                                    selectedId == header.id ? `${styles.active}` : '',
                                    customClasses ? customClasses?.join(' ') : '',
                                ]}>
                                {header.name}
                            </GeralButton>
                        ) : (
                            <button
                                onClick={onButtonClick}
                                className={`${styles.tab} ${selectedId == header.id ? `${styles.active}` : ''} ${
                                    customClasses ? customClasses?.join(' ') : ''
                                }`}
                                data-id={header.id}>
                                {(header.icon == 'mdi:dot' ||
                                    header.icon == 'line-md:loading-loop' ||
                                    header.icon == 'material-symbols:error-outline' ||
                                    header.icon == 'mdi:success') && (
                                    <div
                                        className={styles.iconTop}
                                        data-loading={
                                            header.icon == 'line-md:loading-loop' || header.icon == 'mdi:success'
                                        }
                                        data-error={header.icon == 'material-symbols:error-outline'}>
                                        {header.icon ? <IconifyIcon icon={header.icon} /> : ''}
                                    </div>
                                )}

                                {header.icon &&
                                    header.icon !== 'mdi:dot' &&
                                    header.icon !== 'line-md:loading-loop' &&
                                    header.icon !== 'material-symbols:error-outline' &&
                                    header.icon !== 'mdi:success' && <IconifyIcon icon={header.icon} />}
                                {header.name}
                            </button>
                        )}
                    </SwiperSlide>
                ))}
            </Swiper>
        ) : (
            <div
                className={`${styles.tabs} ${variant == 'buttons' ? styles.geralButtonTab : ''} ${
                    noBorder ? styles.noBorder : ''
                }`}>
                {headers.map((header: Header) => (
                    <div key={header.id} data-disabled={header.disabled}>
                        {variant == 'buttons' ? (
                            <GeralButton
                                onClick={onButtonClick}
                                data-id={header.id}
                                smaller
                                variant='gray'
                                customClasses={[
                                    styles.geralButton,
                                    selectedId == header.id ? `${styles.active}` : '',
                                    customClasses ? customClasses?.join(' ') : '',
                                ]}>
                                {header.name}
                            </GeralButton>
                        ) : (
                            <button
                                onClick={onButtonClick}
                                className={`${styles.tab} ${selectedId == header.id ? `${styles.active}` : ''} ${
                                    customClasses ? customClasses?.join(' ') : ''
                                }`}
                                data-id={header.id}>
                                {(header.icon == 'mdi:dot' ||
                                    header.icon == 'line-md:loading-loop' ||
                                    header.icon == 'material-symbols:error-outline' ||
                                    header.icon == 'mdi:success') && (
                                    <div
                                        className={styles.iconTop}
                                        data-loading={
                                            header.icon == 'line-md:loading-loop' || header.icon == 'mdi:success'
                                        }
                                        data-error={header.icon == 'material-symbols:error-outline'}>
                                        {header.icon ? <IconifyIcon icon={header.icon} /> : ''}
                                    </div>
                                )}

                                {header.icon &&
                                    header.icon !== 'mdi:dot' &&
                                    header.icon !== 'line-md:loading-loop' &&
                                    header.icon !== 'material-symbols:error-outline' &&
                                    header.icon !== 'mdi:success' && <IconifyIcon icon={header.icon} />}
                                {header.name}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )
    ) : (
        <div className={`${styles.dropdownTab} ${isOpenTab ? styles.open : ''}`}>
            <div className={styles.dropdownWrapper}>
                <div className={styles.selectedTab}>
                    <div className={styles.tab} onClick={() => setIsOpenTab(!isOpenTab)}>
                        {/* prevendo ícone */}
                        {headers.find((header) => header.id == selectedId)?.icon && (
                            <IconifyIcon icon={headers.find((header) => header.id == selectedId)?.icon as string} />
                        )}
                        {headers.find((header) => header.id == selectedId)?.name}

                        <IconifyIcon icon='bi:chevron-down' className={styles.iconDown} />
                    </div>
                </div>

                <div className={styles.dropdownLinks} style={{ height: `${headers.length * 45}px` }}>
                    {headers.map((header: Header) => (
                        <button
                            key={header.id}
                            onClick={(event: MouseEvent<HTMLButtonElement>) => {
                                onButtonClick ? onButtonClick(event) : null
                                setIsOpenTab(false)
                            }}
                            className={`${styles.tab} ${selectedId == header.id ? styles.active : ''}`}
                            type='button'
                            data-id={header.id}>
                            {header.icon && <IconifyIcon icon={header.icon} />}
                            {header.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

GeralTab.displayName = 'GeralTab'

export default GeralTab
