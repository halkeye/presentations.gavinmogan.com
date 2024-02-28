const {DateTime} = require("luxon");
const path = require('path');

const markdownItImage = require("markdown-it-eleventy-img");
const Image = require("@11ty/eleventy-img");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const {EleventyHtmlBasePlugin} = require("@11ty/eleventy");

const toImageTag = async (src = 'static/assets/noimage.jpg', alt = "", width = 300) => {
  if (!src) {
    src = "static/assets/noimage.jpg";
  }

  let attributes = {
    src: src.replace('/assets/', 'static/assets/'),
    widths: [width],
    alt: alt || "",
  }
  const imageOptions = {
    // We only need the original width and format
    widths: attributes.widths,
    formats: ['avif', 'png', 'webp', 'jpeg'],
    // Where the generated image files get saved
    outputDir: '_site/assets/images',
    // Public URL path that's referenced in the img tag's src attribute
    urlPath: '/assets/images',
  };
  // generate images, while this is async we don’t wait
  let metadata = await Image(attributes.src, imageOptions);
  return Image.generateHTML(metadata, {
    sizes: '100vw',
    loading: 'lazy',
    decoding: 'async',
    ...attributes,
  });
};

module.exports = eleventyConfig => {
  eleventyConfig.addPassthroughCopy({
    "./public/": "/",
    "./attachments/": "/assets/",
    // "./node_modules/prismjs/themes/prism-okaidia.css": "/css/prism-okaidia.css"
  });

  eleventyConfig.addPassthroughCopy('decks')

  eleventyConfig.addAsyncShortcode('toImageTag', toImageTag)

  eleventyConfig.addFilter("toUpperCase", value => value.toUpperCase())

  eleventyConfig.addFilter("ucFirst", value => value.charAt(0).toUpperCase() + value.slice(1))

  // Customize Markdown library settings:
  eleventyConfig.amendLibrary("md", mdLib => {
    mdLib.use(markdownItImage, {
      resolvePath: (filepath, env) => path.join(path.dirname(env.page.inputPath), filepath),
      imgOptions: {
        widths: [800, 500, 300],
        urlPath: "/images/",
        outputDir: path.join("_site", "images"),
        formats: ["avif", "webp", "jpeg"]
      },
      globalAttributes: {
        class: "markdown-image",
        decoding: "async",
        // If you use multiple widths,
        // don't forget to add a `sizes` attribute.
        sizes: "100vw"
      }
    });
  });

  // Official plugins
  eleventyConfig.addPlugin(pluginSyntaxHighlight, {
    preAttributes: {tabindex: 0}
  });
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Filters
  eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, {zone: zone || "utc"}).toFormat(format || "dd LLLL yyyy");
  });

  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addFilter('toJSON', (data) => {
    return JSON.stringify(data, null, "\t");
  })

  eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
    return (tags || []).filter(tag => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
  });

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid"
    ],

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: false,

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: "njk",

    // These are all optional:
    dir: {
      input: "content",         // default: "."
      includes: "../_includes",  // default: "_includes"
      data: "../_data",          // default: "_data"
      output: "_site"
    },

    // -----------------------------------------------------------------
    // Optional items:
    // -----------------------------------------------------------------

    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

    // When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
    // it will transform any absolute URLs in your HTML to include this
    // folder name and does **not** affect where things go in the output folder.
    pathPrefix: "/",
  };
};
