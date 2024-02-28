module.exports = {
	tags: [
		"presentations"
	],
	"layout": "layouts/presentation.njk",
	eleventyComputed: {
		// data here is the post's data
		permalink: function (data) {
			return `/${data.slug ?? this.slugify(data.page.fileSlug)}/index.html`;
		}
	}
};
