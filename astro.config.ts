import { defineConfig } from "astro/config"
import vercel from "@astrojs/vercel/serverless"
import db from "@astrojs/db"
import tailwind from "@astrojs/tailwind"
import mdx from "@astrojs/mdx"

// https://astro.build/config
export default defineConfig({
	site: "http://localhost",
	output: "server",
	adapter: vercel(),
	integrations: [
		db(),
		tailwind({
			nesting: true,
		}),
		mdx(),
	],
})
