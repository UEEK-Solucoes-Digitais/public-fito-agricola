import styles from './styles.module.scss'

export function FileInput({
    disabled = false,
    name,
    accept,
    onChange,
    onClick,
    text,
}: {
    disabled: boolean
    name: string
    accept?: string
    onClick: (e: any) => void
    onChange?: (e: any) => void
    text: string
}) {
    return (
        <label className={styles.fileInputWrapper} onClick={onClick} data-disabled={disabled}>
            {onChange && <input hidden type='file' name={name} accept={accept} onChange={onChange} />}
            <span>+</span> {text}
        </label>
    )
}
