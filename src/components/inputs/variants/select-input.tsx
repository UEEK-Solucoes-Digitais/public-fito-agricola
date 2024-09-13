import IconifyIcon from '@/components/iconify/IconifyIcon'
import React, { ChangeEvent, ComponentProps, ReactElement, ReactNode, useEffect, useRef, useState } from 'react'
import styles from '../styles.module.scss'

interface SelectSpecificProps extends ComponentProps<'select'> {
    focusEvent?: () => void
    blurEvent?: () => void
    selectType?: number
    icon?: string
    selectPlaceholder?: string
    filterInitialValue?: boolean
}

const SelectInput: React.FC<SelectSpecificProps> = ({ children, focusEvent, blurEvent, ...rest }) => {
    const [openSelect, setOpenSelect] = useState<boolean>(false)
    const [search, setSearch] = useState<string>('')
    const [filteredOptions, setFilteredOptions] = useState<React.ReactNode[]>(React.Children.toArray(children))
    const [inputValue, setInputValue] = useState<string>('')
    const [selectedValue, setSelectedValue] = useState<string>('')
    const ref = useRef<HTMLInputElement>(null)
    const [selectedText, setSelectedText] = useState<string>(rest.selectPlaceholder ?? 'Selecione')

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            const options = document.querySelectorAll(`.${styles.optionItem}`)
            const optionsContainer = document.querySelector(`.${styles.optionsContainer}`)
            const index = Array.from(options).findIndex((option) => option.classList.contains(styles.selected))

            if (!optionsContainer) return

            let newIndex = -1

            if (index === -1) {
                newIndex = 0
                options[0].classList.add(styles.selected)
            } else {
                options[index].classList.remove(styles.selected)
                if (e.key === 'ArrowDown' && index < options.length - 1) {
                    newIndex = index + 1
                } else if (e.key === 'ArrowUp' && index > 0) {
                    newIndex = index - 1
                }
            }

            if (newIndex !== -1) {
                options[newIndex].classList.add(styles.selected)
                const selectedOption = options[newIndex]

                // Ajuste do scroll
                const optionTop = selectedOption.getBoundingClientRect().top
                const containerTop = optionsContainer.getBoundingClientRect().top
                const optionBottom = selectedOption.getBoundingClientRect().bottom
                const containerBottom = optionsContainer.getBoundingClientRect().bottom

                if (optionTop < containerTop) {
                    // Item está acima da view atual
                    optionsContainer.scrollTop -= containerTop - optionTop
                } else if (optionBottom > containerBottom) {
                    // Item está abaixo da view atual
                    optionsContainer.scrollTop += optionBottom - containerBottom
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const options = document.querySelectorAll(`.${styles.optionItem}`)
            const index = Array.from(options).findIndex((option) => option.classList.contains(styles.selected))
            if (index !== -1) {
                const value = options[index].textContent || ''
                setInputValue(value)
                setSelectedText(value)
                setSelectedValue(options[index].textContent || '')

                options[index].dispatchEvent(new Event('mousedown', { bubbles: true }))
            }
        }
    }

    function getPositions() {
        if (ref.current) {
            const inputPosition = ref.current.getBoundingClientRect()
            // const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0

            // const left =
            const parent = ref.current.parentElement?.parentElement?.parentElement?.parentElement?.parentElement
            let left = `${inputPosition.left}px`

            if (parent != null && parent.getAttribute('class')?.includes('gridSelect')) {
                left = `auto`
            }

            // setando altura da div de acordo com o espaço disponível no body

            if (inputPosition.top + 350 > window.innerHeight || inputPosition.top + 350 > window.innerHeight) {
                return {
                    top: `${inputPosition.top + 45}px`,
                    left: `${left}`,
                    height: window.innerHeight - inputPosition.top - 45,
                }
            }

            return { top: `${inputPosition.top + 45}px`, left: `${left}` }
        }
    }

    useEffect(() => {
        // setando propriedade como default se vir somente uma opção, que é o caso de um select com um option
        if (rest.filterInitialValue) {
            const wordsArray = ['property', 'property_id', 'properties_id', 'properties_ids']
            const childrens = React.Children.toArray(children)

            if (wordsArray.includes(rest.name!) && (childrens.length === 2 || childrens.length === 1)) {
                const item = React.Children.toArray(children)[childrens.length === 2 ? 1 : 0]

                if (React.isValidElement(item)) {
                    const value = item.props.value
                    const text = item.props.children
                    setInputValue(getText(text))
                    setSelectedValue(value)
                    setSelectedText(text)

                    if (rest.onChange) {
                        rest.onChange({ target: { name: rest.name, value } } as ChangeEvent<HTMLSelectElement>)
                    }
                }
            }
        }
    }, [])

    // setando valor inicial do input de acordo com o children e com o rest.defaultValue
    useEffect(() => {
        let settedValue = false
        if (rest.defaultValue != null || rest.value != null) {
            React.Children.toArray(children).filter((child) => {
                if (React.isValidElement(child)) {
                    if (
                        child.props.value?.toString() === rest.defaultValue?.toString() ||
                        child.props.value?.toString() === rest.value?.toString()
                    ) {
                        const text = Array.isArray(child.props.children)
                            ? child.props.children.join('')
                            : child.props.children
                        setInputValue(getText(text))
                        setSelectedValue(child.props.value)
                        setSelectedText(text)
                        settedValue = true
                    }
                }

                return false
            })
        }

        if (!settedValue) {
            setInputValue(rest.selectPlaceholder ?? 'Selecione')
            setSelectedValue('0')
        }
    }, [rest.defaultValue, children])

    useEffect(() => {
        // Filtra as opções baseadas no input
        if (search !== '') {
            const filtered = React.Children.toArray(children).filter((child) => {
                if (React.isValidElement(child)) {
                    return (
                        // mesmas validações abaixo e também validação de acento
                        child.props.children
                            .toString()
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .includes(
                                search
                                    .toString()
                                    .toLowerCase()
                                    .normalize('NFD')
                                    .replace(/[\u0300-\u036f]/g, ''),
                            ) ||
                        child.props.children.toString().toLowerCase().includes(search.toString().toLowerCase()) ||
                        child.props.value === '0'
                    )
                }

                return false
            })

            setFilteredOptions(filtered)
        } else {
            setFilteredOptions(React.Children.toArray(children))
        }
    }, [search, children])

    useEffect(() => {
        const handleScroll = () => {
            setOpenSelect(false)
        }

        window.addEventListener('scroll', handleScroll)

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const onInputFocus = () => {
        setInputValue('')
        setOpenSelect(true)
        setSearch('')
    }

    const onInputBlur = () => {
        // Deferindo o fechamento para depois do clique na opção ser processado
        setTimeout(() => {
            setOpenSelect(false)

            if (search === '') {
                setInputValue(getText(selectedText))
            }
        }, 100)
    }

    const isReactElement = (node: ReactNode): node is ReactElement => {
        return typeof node === 'object' && node !== null && 'props' in node
    }

    const getText = (text: string | ReactElement) => {
        if (isReactElement(text)) {
            const textElement = React.Children.toArray(text.props.children).find(
                (child) => isReactElement(child) && child.type === 'p',
            ) as ReactElement

            return textElement ? (textElement.props.children as string) : (text.props.children as string)
        } else {
            return text as string
        }
    }

    const onOptionClick = (value: string, text: string | ReactElement) => {
        const formattedText = getText(text)

        setOpenSelect(false)
        setSearch('')

        setInputValue(formattedText)
        setSelectedText(formattedText)

        const name = rest.name

        rest.onChange?.({ target: { name, value } } as ChangeEvent<HTMLSelectElement>)
    }

    if (!rest.selectType || rest.selectType === 1) {
        return (
            <>
                {rest.icon && <IconifyIcon className={styles.selectIcon} icon={rest.icon} />}
                <div className={styles.selectWrapper}>
                    <div className={styles.inputPreview}>
                        <input
                            type='text'
                            onFocus={onInputFocus}
                            onBlur={onInputBlur}
                            onKeyDown={onKeyDown}
                            ref={ref}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setInputValue(e.target.value)
                            }}
                            value={inputValue}
                        />
                    </div>
                    {openSelect && filteredOptions && (
                        <ul className={styles.optionsContainer} style={getPositions()}>
                            {filteredOptions.map((option) => {
                                if (React.isValidElement(option)) {
                                    const text = Array.isArray(option.props.children)
                                        ? option.props.children.join('')
                                        : option.props.children

                                    return (
                                        <li
                                            key={option.props.value}
                                            className={`${styles.optionItem} ${
                                                option.props.value.toString() === selectedValue.toString()
                                                    ? styles.selected
                                                    : ''
                                            }`}
                                            onMouseDown={() => onOptionClick(option.props.value.toString(), text)}>
                                            {option.props.children}
                                        </li>
                                    )
                                }
                                return null
                            })}
                        </ul>
                    )}
                </div>
            </>
        )
    }

    return (
        <>
            {rest.icon && <IconifyIcon className={styles.selectIcon} icon={rest.icon} />}
            <select
                {...rest}
                value={rest.defaultValue ?? ''}
                defaultValue={rest.defaultValue ?? ''}
                onFocus={focusEvent}
                onBlur={blurEvent}>
                {children}
            </select>
        </>
    )
}

// const SelectInput = forwardRef<HTMLSelectElement, SelectSpecificProps>(
//     (
//         {
//             children,
//             focusEvent,
//             blurEvent,
//             selectType = 1,
//             icon,
//             selectPlaceholder = 'Selecione',
//             filterInitialValue,
//             ...rest
//         },
//         ref,
//     ) => {
//         const [openSelect, setOpenSelect] = useState(false)
//         const [search, setSearch] = useState('')
//         const [filteredOptions, setFilteredOptions] = useState<React.ReactNode[]>(React.Children.toArray(children))
//         const [inputValue, setInputValue] = useState(selectPlaceholder)
//         const [selectedValue, setSelectedValue] = useState('')

//         const inputRef = useRef<HTMLInputElement>(null)

//         useEffect(() => {
//             // Filtrar as opções com base na pesquisa
//             if (search !== '') {
//                 const filtered = React.Children.toArray(children).filter((child) => {
//                     if (React.isValidElement(child)) {
//                         return child.props.children.toString().toLowerCase().includes(search.toLowerCase())
//                     }
//                     return false
//                 })
//                 setFilteredOptions(filtered)
//             } else {
//                 setFilteredOptions(React.Children.toArray(children))
//             }
//         }, [search, children])

//         useEffect(() => {
//             if (rest.defaultValue) {
//                 const selectedChild = React.Children.toArray(children).find((child) => {
//                     if (React.isValidElement(child)) {
//                         return child.props.value?.toString() === rest.defaultValue?.toString()
//                     }
//                     return false
//                 })

//                 if (React.isValidElement(selectedChild)) {
//                     const text = selectedChild.props.children
//                     setInputValue(text.toString())
//                     setSelectedValue(selectedChild.props.value)
//                 }
//             }
//         }, [rest.defaultValue, children])

//         const onInputFocus = () => {
//             setInputValue('')
//             setOpenSelect(true)
//         }

//         const onInputBlur = () => {
//             setTimeout(() => {
//                 setOpenSelect(false)
//                 if (search === '') {
//                     setInputValue(selectedValue || selectPlaceholder)
//                 }
//             }, 100)
//         }

//         const isReactElement = (node: ReactNode): node is ReactElement => {
//             return typeof node === 'object' && node !== null && 'props' in node
//         }

//         const getText = (text: string | Element) => {
//             if (isReactElement(text)) {
//                 const textElement = React.Children.toArray(text.props.children).find(
//                     (child) => isReactElement(child) && child.type === 'p',
//                 ) as ReactElement

//                 return textElement ? (textElement.props.children as string) : (text.props.children as string)
//             } else {
//                 return text as string
//             }
//         }

//         const onOptionClick = (value: string, text: string | Element) => {
//             const formattedText = getText(text)

//             setOpenSelect(false)
//             setSearch('')

//             setInputValue(formattedText)
//             setSelectedText(formattedText)

//             const name = rest.name

//             rest.onChange ? rest.onChange({ target: { name, value } } as ChangeEvent<HTMLSelectElement>) : () => {}
//         }

//         // const getPositions = () => {
//         //     if (inputRef.current) {
//         //         const inputPosition = inputRef.current.getBoundingClientRect()
//         //         return { top: `${inputPosition.top + 45}px`, left: `${inputPosition.left}px` }
//         //     }
//         // }

//         function getPositions() {
//             if (inputRef.current) {
//                 const inputPosition = inputRef.current.getBoundingClientRect()

//                 // const left =
//                 const parent =
//                     inputRef.current.parentElement?.parentElement?.parentElement?.parentElement?.parentElement
//                 let left = `${inputPosition.left}px`

//                 if (parent != null && parent.getAttribute('class')?.includes('gridSelect')) {
//                     left = `auto`
//                 }

//                 // setando altura da div de acordo com o espaço disponível no body
//                 if (inputPosition.top + 350 > window.innerHeight || inputPosition.top + 350 > window.innerHeight) {
//                     return {
//                         top: `${inputPosition.top + 45}px`,
//                         left: `${left}`,
//                         height: window.innerHeight - inputPosition.top - 45,
//                     }
//                 }

//                 return { top: `${inputPosition.top + 45}px`, left: `${left}` }
//             }
//         }

//         return (
//             <div className={styles.inputWrapper}>
//                 {icon && <IconifyIcon className={styles.selectIcon} icon={icon} />}
//                 {selectType === 1 ? (
//                     <div className={styles.selectWrapper}>
//                         <input
//                             type='text'
//                             onFocus={onInputFocus}
//                             onBlur={onInputBlur}
//                             onChange={(e) => setSearch(e.target.value)}
//                             value={inputValue}
//                             ref={inputRef}
//                             className={styles.selectInput}
//                         />
//                         {openSelect && (
//                             <ul className={styles.optionsContainer} style={getPositions()}>
//                                 {filteredOptions.map((option) => {
//                                     if (React.isValidElement(option)) {
//                                         const text = Array.isArray(option.props.children)
//                                             ? option.props.children.join('')
//                                             : option.props.children

//                                         return (
//                                             <li
//                                                 key={option.props.value}
//                                                 className={styles.optionItem}
//                                                 onMouseDown={() => onOptionClick(option.props.value.toString(), text)}>
//                                                 {option.props.children}
//                                             </li>
//                                         )
//                                     }
//                                     return null
//                                 })}
//                             </ul>
//                         )}
//                     </div>
//                 ) : (
//                     <select {...rest} ref={ref} onFocus={focusEvent} onBlur={blurEvent}>
//                         {children}
//                     </select>
//                 )}
//             </div>
//         )
//     },
// )

SelectInput.displayName = 'SelectInput'
export default SelectInput
