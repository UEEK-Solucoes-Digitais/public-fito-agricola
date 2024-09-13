import React from 'react'
import Fancybox from '../fancybox/Fancybox'
import IconifyIcon from '../iconify/IconifyIcon'
import styles from './styles.module.scss'

type ColorType = 'red' | 'yellow' | 'green'
type ColorNumber = number // 1 - 2 - 3

interface LevelProps {
    color: ColorType | ColorNumber
    defaultLevel: boolean
    text?: string
    images?: any[]
    imagePath?: string
    galleryIndex?: string
    stage?: any
    customClass?: string
}

const LevelTarget: React.FC<LevelProps> = ({
    color,
    defaultLevel,
    text = '',
    images = [],
    imagePath = '',
    galleryIndex = '',
    stage = null,
    customClass = '',
}) => {
    let levelText = ''
    let colorType = ''

    if (defaultLevel) {
        switch (color) {
            case 'green':
            case 1:
                colorType = 'green'
                levelText = 'Sem risco'
                break
            case 'yellow':
            case 2:
                colorType = 'yellow'
                levelText = 'Requer atenção'
                break
            case 'red':
            case 3:
                colorType = 'red'
                levelText = 'Requer urgência'
                break
        }
    } else {
        levelText = text

        switch (color) {
            case 'green':
            case 1:
                colorType = 'green'
                break
            case 'yellow':
            case 2:
                colorType = 'yellow'
                break
            case 'red':
            case 3:
                colorType = 'red'
                break
        }
    }

    if (levelText == '') {
        return <></>
    }

    return (
        <div className={styles.levelItemWrap}>
            <span
                className={`${styles.levelItem} ${customClass ? styles[customClass] : ''}`}
                data-color={colorType}
                dangerouslySetInnerHTML={{ __html: levelText }}
            />
            <div className={styles.absoluteItems}>
                {stage && (stage.vegetative_age_text || stage.reprodutive_age_text) && (
                    <div className={styles.levelItemText} title='Este monitoramento possui textos para visualizar'>
                        <IconifyIcon icon='lucide:receipt-text' />
                    </div>
                )}

                {images.length > 0 && (
                    <>
                        <div className={styles.fancyboxItem}>
                            <Fancybox
                                options={{
                                    Carousel: {
                                        infinite: false,
                                    },
                                }}>
                                <a
                                    data-fancybox={`gallery-monitoring-${galleryIndex}`}
                                    data-src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${imagePath}/${images[0].image}`}
                                    className={styles.levelItemImage}
                                    title={`Esse monitoramento possui ${images.length} ${
                                        images.length == 1 ? 'imagem' : 'imagens'
                                    }`}>
                                    <IconifyIcon icon='ph:image' />
                                </a>

                                <div hidden>
                                    {images
                                        .filter((_item, index) => index > 0)
                                        .map((image, index) => (
                                            <div
                                                key={`image-${image.id}-${index}`}
                                                data-fancybox={`gallery-monitoring-${galleryIndex}`}
                                                data-src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${imagePath}/${image.image}`}
                                                className={styles.monitoringImage}
                                            />
                                        ))}
                                </div>
                            </Fancybox>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

LevelTarget.displayName = 'LevelTarget'

export default LevelTarget
