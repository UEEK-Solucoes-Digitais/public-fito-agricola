import type ContentProps from '@/@types/Content'
import CardContent from '@/components/cards/content/Card'
import CardCourse from '@/components/cards/course'
import { Reveal } from '@/components/reveal/reveal'
import { useState } from 'react'
import { FreeMode, Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { KeyedMutator } from 'swr'

import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/navigation'
import styles from './swiper.module.scss'
import ContentCategoryProps from '@/@types/ContentCategory'
import clsx from 'clsx'

interface IProps {
    title: string
    listCourses?: ContentProps[] | undefined
    listContents?: ContentProps[] | undefined
    loading: boolean
    showTimer?: boolean
    showNumber?: boolean
    mutate: KeyedMutator<{
        contents: ContentProps[]
        newest: ContentProps[]
        courses: ContentProps[]
        saved_contents: ContentProps[]
        keep_watching: ContentProps[]
        most_viewed: ContentProps[]
        all_contents: ContentProps[]
        content_categories: ContentCategoryProps[]
        access_enabled: boolean
    }>
}

export default function SwiperComponent({
    title,
    listCourses,
    listContents,
    loading,
    showTimer,
    showNumber,
    mutate,
}: IProps) {
    const [activeCard, setActiveCard] = useState<number | null>(null)
    if (loading || (!listContents && !listCourses)) {
        return
    }

    const isCourses = !!listCourses

    return (
        <>
            <div className={clsx(styles.swiperArea, showNumber && styles.withNumber, showTimer && styles.withTimer)}>
                <span className={styles.title}>{title}</span>

                <Swiper
                    className={styles.swiperContainer}
                    slidesPerGroup={1}
                    spaceBetween={isCourses ? 20 : 12}
                    modules={[FreeMode, Navigation]}
                    nested={true}
                    allowTouchMove={false}
                    followFinger={false}
                    simulateTouch={false}
                    watchSlidesProgress
                    loop={
                        !!(
                            !showNumber &&
                            ((listCourses && listCourses.length > 4) || (listContents && listContents.length > 4))
                        )
                    }
                    freeMode={{
                        enabled: false,
                    }}
                    navigation={{
                        nextEl: styles.swiperNavPrev,
                        prevEl: styles.swiperNavNext,
                    }}
                    breakpoints={{
                        0: {
                            slidesPerView: 3,
                        },
                        1538: {
                            slidesPerView: isCourses ? 4.5 : 4,
                        },
                    }}>
                    {listCourses &&
                        listCourses.map((content, index) => (
                            <SwiperSlide key={content.id}>
                                {({ isVisible }) => (
                                    <Reveal
                                        className={styles.contentArea}
                                        duration={600}
                                        fraction={0.2}
                                        delay={5 * index}
                                        direction='right'
                                        triggerOnce>
                                        <CardCourse
                                            content={content}
                                            isCourse={1}
                                            className={!isVisible ? 'swiper-hidden' : 'swiper-visible'}
                                        />
                                    </Reveal>
                                )}
                            </SwiperSlide>
                        ))}

                    {listContents &&
                        listContents.map((content, index) => (
                            <SwiperSlide key={content.id}>
                                {({ isVisible }) => (
                                    <Reveal
                                        className={styles.contentArea}
                                        duration={600}
                                        fraction={0.2}
                                        delay={5 * index}
                                        direction='right'
                                        triggerOnce>
                                        <CardContent
                                            content={content}
                                            className={!isVisible ? 'swiper-hidden' : 'swiper-visible'}
                                            setActiveCard={setActiveCard}
                                            activeCard={activeCard}
                                            showTimer={showTimer}
                                            showNumber={showNumber ? index + 1 : 0}
                                            mutate={mutate}
                                        />
                                    </Reveal>
                                )}
                            </SwiperSlide>
                        ))}
                </Swiper>
            </div>
        </>
    )
}
