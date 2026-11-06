import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  turbopack: {
    rules: isDev
      ? {
          // LocatorJS: tag JSX with source locations so the LocatorJS browser
          // extension can Option/Alt+click a component to open it in the editor.
          "*.{tsx,jsx}": {
            loaders: [
              {
                loader: "@locator/webpack-loader",
                options: { env: "development" },
              },
            ],
          },
        }
      : {},
  },
};

export default nextConfig;
