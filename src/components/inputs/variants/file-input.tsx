import IconifyIcon from '@/components/iconify/IconifyIcon'
import { ComponentProps, forwardRef } from 'react'
import styles from '../styles.module.scss'

interface InputFileSpecificProps extends ComponentProps<'input'> {
    fileName?: string
    isContractFile?: boolean
    additionalArgs?: Record<string, string | boolean>
}

const FileInput = forwardRef<HTMLInputElement, InputFileSpecificProps>(({ accept, fileName, ...rest }, ref) => {
    const inputId = `file-input-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`

    const getFileSize = (size: string) => {
        if (!size) {
            return ''
        }

        const kb = 1024
        const mb = kb * 1024

        const sizeInByes = parseInt(size)

        if (sizeInByes < kb) {
            return sizeInByes + ' bytes'
        } else if (sizeInByes < mb) {
            return (sizeInByes / kb).toFixed(2) + ' KB'
        } else {
            return (sizeInByes / mb).toFixed(2) + ' MB'
        }
    }

    const fileInfoTemplate = () => (
        <div className={styles.fileInfoContainer}>
            <span className={styles.fileName}>{fileName}</span>
            <span className={styles.fileInfo}>
                {getFileSize(typeof rest.additionalArgs?.fileSize === 'string' ? rest.additionalArgs?.fileSize : '')}
            </span>

            {rest.additionalArgs?.editMode || rest.additionalArgs?.createMode ? (
                <span className={styles.fileChange}>Alterar documento</span>
            ) : (
                <a
                    href={typeof rest.additionalArgs?.fileHref === 'string' ? rest.additionalArgs?.fileHref : ''}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={styles.fileChange}>
                    <IconifyIcon icon='ph:eye' />
                    Visualizar
                </a>
            )}
        </div>
    )

    if (rest.isContractFile) {
        return (
            <div className={styles.contractFileContainer}>
                <label
                    className={`${styles.contractFile} ${!rest.additionalArgs?.editMode && !rest.additionalArgs?.createMode ? styles.inactive : ''}`}>
                    <input {...rest} type='file' hidden id={inputId} accept={accept} ref={ref} />
                    <div className={styles.outer}>
                        <IconifyIcon icon='f7:doc' />
                    </div>

                    {!fileName
                        ? (rest.additionalArgs?.editMode || rest.additionalArgs?.createMode) && (
                              <span className={styles.addButton}>
                                  Adicionar {rest.additionalArgs?.fileTypeName ?? 'arquivo'}
                              </span>
                          )
                        : (rest.additionalArgs?.editMode || rest.additionalArgs?.createMode) && fileInfoTemplate()}
                </label>

                {!rest.additionalArgs?.editMode && !rest.additionalArgs?.createMode && fileName && fileInfoTemplate()}
            </div>
        )
    }

    return (
        <div className={styles.inputFileWrapper}>
            <input {...rest} type='file' hidden id={inputId} accept={accept} ref={ref} />
            <span className={styles.fileName} data-file={!!(fileName != '' && fileName != 'Nome do arquivo')}>
                {fileName ?? 'Nenhum arquivo selecionado'}
            </span>

            <label htmlFor={inputId} className={styles.labelButton} data-disabled={'readOnly' in rest && rest.readOnly}>
                Procurar
            </label>
        </div>
    )
})

FileInput.displayName = 'FileInput'
export default FileInput
