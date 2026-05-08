import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'psxnonvwqbuprjcasrxb.supabase.co',
      },
    ],
  },
};

export default nextConfig;
