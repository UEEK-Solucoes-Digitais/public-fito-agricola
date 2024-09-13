import { useEffect, useRef, MutableRefObject } from 'react'

type OnOutsideClick = () => void

const useOutsideClick = <T extends HTMLElement = HTMLDivElement | any>(
    onOutsideClick: OnOutsideClick,
    exceptionClass?: string,
): MutableRefObject<T | null> => {
    const ref = useRef<T | null>(null)

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            const targetElement = event.target as HTMLElement

            if (exceptionClass && targetElement.classList.contains(exceptionClass)) {
                return
            }
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onOutsideClick()
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
        }
    }, [onOutsideClick, exceptionClass])

    return ref
}

export default useOutsideClick
