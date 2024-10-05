/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    env: {
        ENABLE_TUAH: process.env.ENABLE_TUAH,
    },
    basePath: '/Plus2Bot',
}

export default nextConfig;
