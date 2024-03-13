import { z, defineCollection } from "astro:content"

export const collections = {
	docs: defineCollection({
		schema: z.object({
			title: z.string(),
		}),
	}),
}
