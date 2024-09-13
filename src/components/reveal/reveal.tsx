import type { ReactNode } from 'react'
import {
    Bounce as BounceReveal,
    Fade as FadeReveal,
    Flip as FlipReveal,
    Hinge as HingeReveal,
    JackInTheBox as JackInTheBoxReveal,
    Reveal as RevealAwesome,
    Roll as RollReveal,
    Rotate as RotateReveal,
    Slide as SlideReveal,
    Zoom as ZoomReveal,
    type BounceProps,
    type FadeProps,
    type FlipProps,
    type HingeProps,
    type JackInTheBoxProps,
    type RollProps,
    type RotateProps,
    type SlideProps,
    type ZoomProps,
} from 'react-awesome-reveal'

import { keyframes } from '@emotion/react'

type DirectionTypes = 'up' | 'down' | 'left' | 'right'

function getEffect(direction: DirectionTypes, distance: string) {
    switch (direction) {
        case 'up':
            return keyframes`
                0% {
                    opacity: 0;
                    visibility: hidden;
                    -webkit-transform: translateY(${distance});
                    transform: translateY(${distance});
                }
                100% {
                    opacity: 1;
                    visibility: visible;
                    -webkit-transform: translateY(0);
                    transform: translateY(0);
                }
            `
        case 'down':
            return keyframes`
                0% {
                    opacity: 0;
                    visibility: hidden;
                    -webkit-transform: translateY(-${distance});
                    transform: translateY(-${distance});
                }
                100% {
                    opacity: 1;
                    visibility: visible;
                    -webkit-transform: translateY(0);
                    transform: translateY(0);
                }
            `
        case 'left':
            return keyframes`
                0% {
                    opacity: 0;
                    visibility: hidden;
                    -webkit-transform: translateX(-${distance});
                    transform: translateX(-${distance});
                }
                100% {
                    opacity: 1;
                    visibility: visible;
                    -webkit-transform: translateX(0);
                    transform: translateX(0);
                }
            `
        case 'right':
            return keyframes`
                0% {
                    opacity: 0;
                    visibility: hidden;
                    -webkit-transform: translateX(${distance});
                    transform: translateX(${distance});
                }
                100% {
                    opacity: 1;
                    visibility: visible;
                    -webkit-transform: translateX(0);
                    transform: translateX(0);
                }
            `
    }
}

export function Reveal({
    direction = 'up',
    distance = '40px',
    children,
    ...props
}: BounceProps & {
    direction?: DirectionTypes
    distance?: string
    children: ReactNode
}) {
    return (
        <RevealAwesome keyframes={getEffect(direction, distance)} {...props}>
            {children}
        </RevealAwesome>
    )
}

export function Bounce({ children, ...props }: BounceProps & { children: ReactNode }) {
    return <BounceReveal {...props}>{children}</BounceReveal>
}

export function Fade({ children, ...props }: FadeProps & { children: ReactNode }) {
    return <FadeReveal {...props}>{children}</FadeReveal>
}

export function Flip({ children, ...props }: FlipProps & { children: ReactNode }) {
    return <FlipReveal {...props}>{children}</FlipReveal>
}

export function Hinge({ children, ...props }: HingeProps & { children: ReactNode }) {
    return <HingeReveal {...props}>{children}</HingeReveal>
}

export function JackInTheBox({ children, ...props }: JackInTheBoxProps & { children: ReactNode }) {
    return <JackInTheBoxReveal {...props}>{children}</JackInTheBoxReveal>
}

export function Roll({ children, ...props }: RollProps & { children: ReactNode }) {
    return <RollReveal {...props}>{children}</RollReveal>
}

export function Rotate({ children, ...props }: RotateProps & { children: ReactNode }) {
    return <RotateReveal {...props}>{children}</RotateReveal>
}

export function Slide({ children, ...props }: SlideProps & { children: ReactNode }) {
    return <SlideReveal {...props}>{children}</SlideReveal>
}

export function Zoom({ children, ...props }: ZoomProps & { children: ReactNode }) {
    return <ZoomReveal {...props}>{children}</ZoomReveal>
}
