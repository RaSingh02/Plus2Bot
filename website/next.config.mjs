/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
    env: {
        ENABLE_TUAH: process.env.ENABLE_TUAH,
    },
}

export default nextConfig;
