'use client'

import { ChangeEvent, FC } from 'react'

import { useNotification } from '@/context/ToastContext'

import Fancybox from '@/components/fancybox/Fancybox'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import Image from 'next/image'

import { FreeMode } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import 'swiper/css'
import 'swiper/css/free-mode'

import MonitoringImage from '@/@types/MonitoringImage'
import { useAdmin } from '@/context/AdminContext'
import updateStatus from '@/utils/updateStatus'
import styles from './gallery.module.scss'

interface ImageProps {
    type: string
    selectedFiles: MonitoringImage[]
    setSelectedFiles: (files: MonitoringImage[], removeImage: boolean) => void
    loading: boolean
}

const ImageGallery: FC<ImageProps> = ({ type, selectedFiles, setSelectedFiles, loading }) => {
    const { setToast } = useNotification()
    const { admin } = useAdmin()

    function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
        const { files } = e.target

        if (files) {
            const newFiles = Array.from(files).map((file, index) => ({
                id: `${Date.now()}-${index + 1}`,
                file,
                preview: URL.createObjectURL(file),
                isFromDatabase: false,
                idDatabase: '',
                loading: false,
            }))

            // if (newFiles.some((fileWrapper) => fileWrapper.file.size > 2 * 1024 * 1024)) {
            //     setToast({ text: 'Cada arquivo deve ter no máximo 2MB', state: 'warning' });
            //     return;
            // }

            const allFiles = [...selectedFiles, ...newFiles]
            // const totalSize = allFiles.reduce((sum, item) => sum + (item.file?.size ?? 0), 0);
            // const megabytes = 20;

            // if (totalSize > megabytes * 1024 * 1024) {
            //     setToast({ text: 'A soma dos tamanhos dos arquivos excede o limite de 16MB.', state: 'warning' });
            //     return;
            // }

            if (allFiles.length > 10) {
                setToast({ text: 'Permitido apenas 10 arquivos.', state: 'warning' })
                return
            }

            setSelectedFiles(allFiles, false)
        }
    }

    async function handleFileRemove(fileId: string, idDatabase: any) {
        if (idDatabase) {
            if (confirm('Deseja remover essa imagem?')) {
                setToast({ text: 'Removendo imagem', state: 'loading' })
                await updateStatus('/api/contents/delete-image', admin.id, idDatabase, 0).then(() => {
                    setToast({ text: `Imagem removida`, state: 'success' })
                    setSelectedFiles(
                        selectedFiles.filter(({ id }) => id !== fileId),
                        true,
                    )
                })
            }
        } else {
            setSelectedFiles(
                selectedFiles.filter(({ id }) => id != fileId),
                true,
            )
        }
    }

    function handleImageLoad(id: string) {
        setSelectedFiles(
            selectedFiles.map((file) => (file.id == id ? { ...file, loading: false } : file)),
            true,
        )
    }

    return (
        <div>
            <h5 className={styles.title} style={{ marginBottom: '10px' }}>
                Imagens (520x325px)
            </h5>

            <div className={`${styles.imageGroup}`}>
                <label
                    htmlFor={`input-media-${type}`}
                    className={`${styles.imagePreview} ${styles.toAdd}`}
                    title='Clique para anexar arquivos'
                    data-loading={loading}>
                    <input
                        id={`input-media-${type}`}
                        type='file'
                        name='files'
                        onChange={handleFileSelect}
                        multiple
                        accept='.pdf, .jpeg, .jpg, .png, .mp4'
                        readOnly={loading}
                        hidden
                    />

                    {!loading && <IconifyIcon icon='fluent:add-28-regular' />}
                </label>

                {selectedFiles && selectedFiles.length > 0 && (
                    <div className={`${styles.imageFiles}`}>
                        <Fancybox>
                            <Swiper slidesPerView={'auto'} spaceBetween={30} modules={[FreeMode]} freeMode>
                                {selectedFiles.map(
                                    (
                                        { file, preview, isFromDatabase, id, idDatabase, loading: loadingImage },
                                        fileIndex,
                                    ) => (
                                        <SwiperSlide key={`${type}-${id}-${fileIndex}`}>
                                            <div
                                                className={`${styles.imagePreview} ${styles.cardPreview} ${
                                                    loadingImage ? styles.loading : ''
                                                }`}
                                                data-src={
                                                    isFromDatabase
                                                        ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/contents/${preview}`
                                                        : preview
                                                }
                                                data-fancybox='estadios'
                                                title='Clique para visualizar a imagem'
                                                aria-label='Clique para visualizar a imagem'>
                                                <Image
                                                    src={
                                                        isFromDatabase
                                                            ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/contents/${preview}`
                                                            : preview
                                                    }
                                                    alt={`Preview da imagem ${file?.name}`}
                                                    loading='lazy'
                                                    quality={30}
                                                    // onLoad={() => handleImageLoad(id)}
                                                    fill
                                                />

                                                {!loading && (
                                                    <button
                                                        className={styles.buttonRemove}
                                                        onClick={() => handleFileRemove(id, idDatabase)}
                                                        title='Clique para remover a imagem'
                                                        aria-label='Clique para remover a imagem'>
                                                        <IconifyIcon icon='ph:trash' />
                                                    </button>
                                                )}
                                            </div>
                                        </SwiperSlide>
                                    ),
                                )}
                            </Swiper>
                        </Fancybox>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ImageGallery
