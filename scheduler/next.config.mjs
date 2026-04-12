/** @type {import('next').NextConfig} */
const nextConfig = {
	reactCompiler: true,
	compress: true,
	productionBrowserSourceMaps: false,
	images: {
		unoptimized: false,
		remotePatterns: [
			{ protocol: "https", hostname: "**" },
			{ protocol: "http", hostname: "**" },
		],
	},
};

export default nextConfig;
