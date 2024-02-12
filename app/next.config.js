/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: false,
  webpack: (config, context) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    if (config.plugins) {
      config.plugins.push(
        new context.webpack.IgnorePlugin({
          resourceRegExp: /^(lokijs|pino-pretty|encoding)$/,
        }),
      );
    }
    return config;
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
