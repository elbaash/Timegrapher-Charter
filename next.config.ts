import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Static export — the app is an installable offline PWA served as plain files (no Node server).
  output: 'export',
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // @gutenye/ocr-browser pulls in onnxruntime-web + @techstark/opencv-js, which reference Node
  // built-ins that don't exist in the browser. Stub them so the client bundle builds.
  webpack: (config) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      crypto: false,
      os: false,
      stream: false,
    };
    return config;
  },
  images: {
    // Static export has no image-optimization server; all images are local data-URLs anyway.
    unoptimized: true,
  },
};

export default nextConfig;
