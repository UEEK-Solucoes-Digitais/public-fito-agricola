// YouTubePlayer.js
import ContentVideo from '@/@types/ContentVideo'
import { useAdmin } from '@/context/AdminContext'
import { convertToSeconds } from '@/utils/formats'
import axios from 'axios'
import Image from 'next/image'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import ReactPlayer from 'react-player'
import { OnProgressProps } from 'react-player/base'
import GeralButton from '../buttons/GeralButton'
import IconifyIcon from '../iconify/IconifyIcon'
import styles from './styles.module.scss'
interface IProps {
    video: ContentVideo
    handleVideoSelect: (video: ContentVideo) => void
    videos: ContentVideo[]
}

export default function YouTubePlayer({ video, videos, handleVideoSelect }: IProps) {
    const { admin } = useAdmin()

    // const [currentVideo, setCurrentVideo] = useState<ContentVideo>(video);

    const refVideo = useRef<ReactPlayer>(null)

    const [lastSecond, setLastSecond] = useState(video.watched_seconds ? parseInt(video.watched_seconds) : 0)
    const [lastSecondAll, setLastSecondAll] = useState(
        video.watched_seconds ? parseInt(video.watched_seconds) : 0,
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [isPaused, setIsPaused] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)

    const [isFinished, setIsFinished] = useState(false)
    const [reproduceAgain, setReproduceAgain] = useState(false)

    const [volume, setVolume] = useState(50)

    const onProgress = async (state: OnProgressProps) => {
        const seconds = state.playedSeconds

        setLastSecondAll(seconds)

        if (parseInt(seconds.toString()) == 1 || seconds - lastSecond >= 15) {
            if (isSubmitting) {
                return
            }

            setIsSubmitting(true)

            // transformando seconds em hora, depois minuto, depois segundo e criando uma string 00:00:00
            const hours = Math.floor(seconds / 3600)
                .toString()
                .padStart(2, '0')
                .substring(0, 2)
            const minutes = Math.floor((seconds % 3600) / 60)
                .toString()
                .padStart(2, '0')
                .substring(0, 2)
            const seconds2 = Math.floor((seconds % 3600) % 60)
                .toString()
                .padStart(2, '0')
                .substring(0, 2)

            const time = `${hours}:${minutes}:${seconds2}`

            await axios
                .post('/api/contents/update-watched', {
                    admin_id: admin.id.toString(),
                    content_video_id: video.id,
                    item: 'last_second',
                    value: time,
                })
                .then(() => {
                    setLastSecond(seconds)
                })
                .catch((error) => {
                    console.error(error)
                })

            setIsSubmitting(false)
        }
    }

    const onEnded = async () => {
        setIsFullScreen(false)
        setIsFinished(true)

        await axios
            .post('/api/contents/update-watched', {
                admin_id: admin.id.toString(),
                content_video_id: video.id,
                item: 'last_second',
                value: video.duration_time,
            })
            .then(() => {
                setLastSecond(convertToSeconds(video.duration_time))
            })
            .catch((error) => {
                console.error(error)
            })

        await axios
            .post('/api/contents/update-watched', {
                admin_id: admin.id.toString(),
                content_video_id: video.id,
                item: 'is_finished',
                value: '1',
            })
            .then(() => {
                console.log('OK')
            })
            .catch((error) => {
                console.error(error)
            })
    }

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
            .toString()
            .padStart(2, '0')
            .substring(0, 2)
        const mins = Math.floor((seconds % 3600) / 60)
            .toString()
            .padStart(2, '0')
            .substring(0, 2)
        const secs = Math.floor((seconds % 3600) % 60)
            .toString()
            .padStart(2, '0')
            .substring(0, 2)
        return `${hours}:${mins}:${secs}`
    }

    const handleButtonAction = () => {
        if (refVideo.current) {
            if (!isPaused) {
                refVideo.current.getInternalPlayer()?.pauseVideo()
                setIsPaused(true)
            } else {
                refVideo.current.getInternalPlayer()?.playVideo()
                setIsPaused(false)
            }
        }
    }

    // const handleMouseClick = (e: MouseEvent<HTMLDivElement>) => {
    //     const rect = e.currentTarget.getBoundingClientRect()
    //     const x = e.clientX - rect.left
    //     const width = rect.width
    //     const percentage = x / width
    //     const time = convertToSeconds(video.duration_time) * percentage
    //     setLastSecond(0)
    //     setLastSecondAll(0)
    //     setIsFinished(false)
    //     setReproduceAgain(true)
    //     refVideo.current?.seekTo(time)
    // }

    const onReady = () => {
        if (video.watched_seconds) {
            if (refVideo.current) {
                refVideo.current.seekTo(convertToSeconds(video.watched_seconds))
                refVideo.current.getInternalPlayer()?.playVideo()
                setIsPaused(false)
            }
        }
    }

    // useEffect(() => {
    //     if(refVideo.current){
    //         refVideo.current.getInternalPlayer()?.getCurrentTime();
    //     }
    // },[refVideo]);

    useEffect(() => {
        if (video && video.is_finished !== 0 && !reproduceAgain) {
            setIsFinished(true)
        }
    }, [video])

    const getThumb = function (url: string) {
        if (url == null) {
            return ''
        }

        let results
        let video

        if (url.includes('live') || url.includes('shorts')) {
            video = url.split('/').pop()?.split('?')[0]
        } else {
            results = url.match('[\\?&]v=([^&#]*)')
            video = results == null ? url.split('/').pop()?.split('?')[0] : results[1]
        }

        return 'http://img.youtube.com/vi/' + video + '/0.jpg'
    }

    const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setVolume(parseInt(e.target.value))
        // refVideo.current?.getInternalPlayer()?.setVolume(parseInt(e.target.value));
    }

    const handleDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
        const percentage = parseInt(e.target.value)
        const time = convertToSeconds(video.duration_time) * (percentage / 100)
        // setLastSecond(0);
        // setLastSecondAll(0);
        setIsFinished(false)
        setReproduceAgain(true)
        refVideo.current?.seekTo(time)
    }

    const handleVolumeButton = (operation: number) => {
        if (operation == 1) {
            if (volume + 10 > 100) {
                setVolume(100)
            } else {
                setVolume(volume + 10)
            }
        } else {
            if (volume - 10 < 0) {
                setVolume(0)
            } else {
                setVolume(volume - 10)
            }
        }
    }

    // const videoId = getVideoId(videoUrl)

    return (
        <div className={`${styles.wrapVideoAndControlsParent} ${isFullScreen ? styles.fullscreen : ''}`}>
            <div className={`${styles.wrapVideoAndControls} `}>
                <div className={styles.youtubeVideoWrapper}>
                    {isFinished && (
                        <div className={styles.finishedVideo}>
                            <Image src={getThumb(video.video_link)} alt='Thumbnail' loading='lazy' fill />

                            <div className={styles.textContent}>
                                <h1>Você finalizou este vídeo!</h1>
                                <GeralButton
                                    variant='tertiary'
                                    small
                                    value='Assistir novamente'
                                    onClick={() => {
                                        refVideo.current?.seekTo(0)
                                        setIsPaused(false)
                                        setLastSecond(0)
                                        setLastSecondAll(0)
                                        setReproduceAgain(true)
                                        setIsFinished(false)
                                    }}
                                />

                                {videos?.length > 1 &&
                                    videos.indexOf(video) >= 0 &&
                                    videos[videos.indexOf(video) + 1] && (
                                        <GeralButton
                                            variant='primary'
                                            small
                                            value='Próximo vídeo'
                                            onClick={() => {
                                                const index = videos.indexOf(video)
                                                handleVideoSelect(videos[index + 1])
                                                refVideo.current?.seekTo(0)
                                                setIsPaused(false)
                                                setLastSecond(0)
                                                setLastSecondAll(0)
                                                setReproduceAgain(true)
                                                setIsFinished(false)
                                            }}
                                        />
                                    )}
                            </div>
                        </div>
                    )}
                    <ReactPlayer
                        ref={refVideo}
                        url={video.video_link}
                        playing
                        controls={false}
                        onProgress={onProgress}
                        onEnded={onEnded}
                        className={styles.video}
                        width={'100%'}
                        onReady={onReady}
                        volume={volume / 100}
                    />
                </div>
                <div className={styles.controls}>
                    <button type='button' onClick={() => handleButtonAction()}>
                        <IconifyIcon icon={isPaused ? 'lucide:play' : 'lucide:pause'} />
                    </button>

                    <div className={styles.volumeWrapper}>
                        <button type='button'>
                            <IconifyIcon icon='ph:speaker-high' />
                        </button>

                        <div className={styles.volumeControlWrap}>
                            <button type='button' onClick={() => handleVolumeButton(1)}>
                                <IconifyIcon icon='ph:plus' />
                            </button>

                            <div className={styles.barAndInputWrapper}>
                                <input
                                    type='range'
                                    min='0'
                                    max='100'
                                    step='1'
                                    onChange={handleVolumeChange}
                                    value={volume}
                                />
                                <div className={styles.inputBarWrapper}>
                                    <div className={styles.inputBar} style={{ height: `${volume}%` }}></div>
                                </div>
                            </div>
                            <button onClick={() => handleVolumeButton(2)}>
                                <IconifyIcon icon='ph:minus' />
                            </button>
                        </div>
                    </div>
                    <div className={styles.progressBar}>
                        {/* <div className={styles.bar} onClick={handleMouseClick}>
                            <div className={styles.backgroundBar} style={{width: `${(convertToSeconds(formatTime(lastSecondAll)) / convertToSeconds(video.duration_time)) * 100}%`}}></div>
                        </div> */}

                        <div className={styles.barAndInputWrapper}>
                            <input
                                type='range'
                                min='0'
                                max='100'
                                step='1'
                                onChange={handleDurationChange}
                                value={
                                    (convertToSeconds(formatTime(lastSecondAll)) /
                                        convertToSeconds(video.duration_time)) *
                                    100
                                }
                            />
                            <div className={styles.inputBarWrapper}>
                                <div
                                    className={styles.inputBar}
                                    style={{
                                        width: `${(convertToSeconds(formatTime(lastSecondAll)) / convertToSeconds(video.duration_time)) * 100}%`,
                                    }}></div>
                            </div>
                        </div>

                        <div className={styles.videoProgress}>
                            {formatTime(lastSecondAll)} / {video.duration_time}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setIsFullScreen(!isFullScreen)
                        }}>
                        <IconifyIcon icon='material-symbols:fullscreen' />
                    </button>
                </div>
            </div>
        </div>
    )
}
