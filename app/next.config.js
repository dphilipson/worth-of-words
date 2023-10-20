/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
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
};

module.exports = nextConfig;
