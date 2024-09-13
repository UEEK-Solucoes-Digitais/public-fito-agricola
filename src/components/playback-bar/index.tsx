import { convertToSeconds } from '@/utils/formats'
import React from 'react'
import styles from './styles.module.scss'

interface PlaybackBarProps {
    durationTime: string
    currentTime: string
    countFinished: number
    countVideos: number
}

const PlaybackBar: React.FC<PlaybackBarProps> = ({ durationTime, currentTime, countFinished, countVideos }) => {
    const getWidth = () => {
        if (countVideos > 1) {
            return (countFinished / countVideos) * 100
        } else {
            return (convertToSeconds(currentTime) / convertToSeconds(durationTime)) * 100
        }
    }

    const progressBarWidth = getWidth()
    // const progressBarWidth = (convertToSeconds(currentTime) / convertToSeconds(duration)) * 100;

    return (
        <div className={styles.playbackContainer}>
            <div className={styles.playbackBar}>
                <div className={styles.progress} style={{ width: `${progressBarWidth}%` }} />
            </div>

            <div className={styles.timer}>
                <span>{countVideos > 1 ? `${countFinished}` : currentTime}</span> /{' '}
                <span>{countVideos > 1 ? `${countVideos} vídeos` : durationTime}</span>
            </div>
        </div>
    )
}

export default PlaybackBar
