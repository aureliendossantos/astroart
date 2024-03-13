import { column, defineDb, defineTable } from "astro:db"

// https://astro.build/db/config

const Work = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		slug: column.text(),
		type: column.text(),
		title: column.text(),
		createdAt: column.date(),
		updatedAt: column.date(),
		sourceId: column.text(),
	},
})

const Picture = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		language: column.text(),
		order: column.number(),
		createdAt: column.date(),
		updatedAt: column.date(),
		coverOfId: column.number({ references: () => Work.columns.id }),
		screenshotOfId: column.number({ references: () => Work.columns.id }),
	},
})

const Image = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		url: column.text(),
		width: column.number(),
		height: column.number(),
		pictureId: column.number({ references: () => Picture.columns.id }),
	},
})

const IgdbAccessToken = defineTable({
	columns: {
		token: column.text(),
		expiresAt: column.date(),
	},
})

export default defineDb({
	tables: { Work, Picture, Image, IgdbAccessToken },
})
