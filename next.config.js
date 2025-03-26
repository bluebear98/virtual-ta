/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
  // Add this line to specify pages directory
  pageExtensions: ['ts', 'tsx', 'js', 'jsx']
}

module.exports = nextConfig
