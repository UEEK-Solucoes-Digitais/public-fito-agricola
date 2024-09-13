'use client'

import dynamic from 'next/dynamic'

const IconifyIcon = dynamic(() => import('@iconify/react').then((mod) => mod.Icon), {
    ssr: false,
})

IconifyIcon.displayName = 'IconifyIcon'

export default IconifyIcon
