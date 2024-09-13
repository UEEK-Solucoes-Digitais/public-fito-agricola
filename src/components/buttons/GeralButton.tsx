import clsx from 'clsx'
import Link from 'next/link'
import React, { ButtonHTMLAttributes } from 'react'
import styles from './styles.module.scss'

type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'quaternary'
    | 'gray'
    | 'full-gray'
    | 'delete'
    | 'inline'
    | 'noStyle'
    | 'smaller'
    | 'primaryInline'
    | 'inlineGreen'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    value?: string
    round?: boolean
    small?: boolean
    smaller?: boolean
    smallIcon?: boolean
    children?: React.ReactNode
    variant?: ButtonVariant
    customClasses?: string[]
    loading?: boolean
    href?: string
    external?: boolean
}

export default function GeralButton({
    customClasses,
    value,
    type,
    children,
    variant = 'primary',
    round,
    small,
    smallIcon,
    smaller,
    loading = false,
    href,
    external = false,
    ...rest
}: ButtonProps) {
    if (rest?.disabled && variant == 'secondary') {
        variant = 'full-gray'
    }

    const buttonClasses = clsx(
        styles.geralButton,
        styles[variant],
        {
            [styles.round]: round,
            [styles.small]: small,
            [styles.smaller]: smaller,
            [styles.smallIcon]: smallIcon,
            [styles.loading]: loading,
        },
        customClasses,
    )

    return (
        <>
            {href ? (
                <Link
                    href={href}
                    className={buttonClasses}
                    role='button'
                    data-disabled={rest?.disabled ?? false}
                    target={external ? '_blank' : '_self'}>
                    {children}
                    {value}
                </Link>
            ) : (
                <button className={buttonClasses} {...rest} type={type} role='button'>
                    {children}
                    {value}
                </button>
            )}
        </>
    )
}
