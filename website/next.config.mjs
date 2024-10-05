/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
    env: {
        ENABLE_TUAH: process.env.ENABLE_TUAH,
    },
    basePath: process.env.NODE_ENV === 'production' ? '/Plus2Bot' : '',
}

export default nextConfig;
