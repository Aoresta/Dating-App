import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const nextConfig: NextConfig = {
  turbopack: {
    root: currentDir,
  },
};

export default nextConfig;
