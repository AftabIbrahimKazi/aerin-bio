import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Default breakpoints jump 128 -> 256, so a 2x-DPR request for an
    // 88px avatar (PeopleOrbit.tsx) rounds all the way up to 256 and
    // ships a much larger file than the box ever displays. 160/192 give
    // the optimizer a closer match for that specific size.
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 192, 256, 384],
  },
};

export default nextConfig;
