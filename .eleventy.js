const { DateTime } = require("luxon");
const path = require("path");
const postcss = require("postcss");
const tailwindcss = require("@tailwindcss/postcss");
const autoprefixer = require("autoprefixer");
const markdownItImage = require("markdown-it-eleventy-img");
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
const Image = require("@11ty/eleventy-img");
const svgSprite = require("eleventy-plugin-svg-sprite");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

module.exports = (eleventyConfig) => {
  eleventyConfig.setServerOptions({
    // Whether DOM diffing updates are applied where possible instead of page reloads
    domDiff: false,
  });

  eleventyConfig.addPassthroughCopy({
    "content/decks/vanjs-2025-03-26/ctrl-r.mp4": "decks/vanjs-2025-03-26/ctrl-r.mp4",
    "node_modules/reveal.js/dist": "assets/reveal/",
    "node_modules/reveal.js/plugin": "assets/reveal/plugin",
    "node_modules/lite-youtube-embed/src": "assets/lite-youtube-embed/src",
    "_includes/tailwind.css": "tailwind.css",
  });

  eleventyConfig.addNunjucksAsyncFilter("postcss", (cssCode, done) => {
    postcss([tailwindcss(), autoprefixer()])
      .process(cssCode, { from: "./_includes/tailwind.css" })
      .then(
        (r) => done(null, r.css),
        (e) => done(e, null),
      );
  });

  eleventyConfig.addWatchTarget("_includes/**/*.css");

  eleventyConfig.addPassthroughCopy({
    "./public/": "/",
    "./attachments/": "/assets/",
    "./static/assets/": "/assets/",
    // "./node_modules/prismjs/themes/prism-okaidia.css": "/css/prism-okaidia.css"
  });

  eleventyConfig.addAsyncShortcode("svgIcon", async (src, options = {}) => {
    let metadata = await Image(src, {
      formats: ["svg"],
      dryRun: true,
    });
    const body = metadata.svg[0].buffer.toString();
    const firstTagAttributes = body
      .match(/(\w*) *= *((['"])?((\\\3|[^\3])*?)\3|(\w+))/gm)
      .reduce((ret, str) => {
        let [key, val] = str.split("=", 2);
        if (val.startsWith('"')) {
          val = val.replace(/^"(.*)"$/, "$1");
        } else {
          val = val.replace(/^'(.*)'$/, "$1");
        }
        ret[key] = val;
        return ret;
      }, {});
    for (const field of Object.keys(options)) {
      if (options[field]) {
        firstTagAttributes[field] = (firstTagAttributes[field] || "")
          .split(/\s+/)
          .map((str) => str.trim())
          .filter(Boolean)
          .concat(options[field].split(/\s+/))
          .join(" ");
      }
    }
    return body
      .trim()
      .replace(
        /^<(\w+)\s*([^>]*)>(.*)$/,
        function (_match, tag, attributes, rest) {
          attributes = Object.entries(firstTagAttributes)
            .map(([key, value]) => `${key}="${value.replaceAll(/"/g, '\\"')}"`)
            .join(" ");
          return `<${tag} ${attributes}>${rest}`;
        },
      );
  });

  eleventyConfig.addFilter("absoluteUrl", function (url = "") {
    const baseUrl =
      process.env.OVERRIDE_BASE_URL || `https://presentations.gavinmogan.com`;

    try {
      return new URL(url, baseUrl).href;
    } catch (err) {
      console.error(err);
      return url;
    }
  });

  eleventyConfig.addFilter("toUpperCase", (value) => value.toUpperCase());

  eleventyConfig.addFilter(
    "ucFirst",
    (value) => value.charAt(0).toUpperCase() + value.slice(1),
  );

  // Customize Markdown library settings:
  eleventyConfig.amendLibrary("md", (mdLib) => {
    mdLib.use(markdownItImage, {
      resolvePath: (filepath, env) =>
        path.join(path.dirname(env.page.inputPath), filepath),
      imgOptions: {
        widths: [800, 500, 300],
        urlPath: "/images/",
        outputDir: path.join("_site", "images"),
        formats: ["avif", "webp", "jpeg"],
      },
      globalAttributes: {
        class: "markdown-image",
        decoding: "async",
        // If you use multiple widths,
        // don't forget to add a `sizes` attribute.
        sizes: "100vw",
      },
    });
  });

  eleventyConfig.addPlugin(pluginSyntaxHighlight, {
    preAttributes: { tabindex: 0 },
  });

  eleventyConfig.addPlugin(svgSprite, {
    path: "./static/assets/",
  });

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin);

  // Filters
  eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(
      format || "dd LLLL yyyy",
    );
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("toBool", (data) => {
    return !!data;
  });

  eleventyConfig.addFilter("toJSON", (data) => {
    return JSON.stringify(data, null, "\t");
  });

  eleventyConfig.addFilter("getSlides", (pres) => {
    return pres.data?.slides;
  });

  eleventyConfig.addFilter("getRecording", (pres) => {
    return pres.data?.recording;
  });

  eleventyConfig.addFilter("recordingURL", (recording) => {
    if (!recording) {
      throw new Error(`No recording data`);
    }
    if (recording.type === "youtube") {
      return `https://www.youtube.com/watch?v=${recording.id}`;
    }
    throw new Error(`Unknown recording type: ${recording.type}`);
  });

  eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
    return (tags || []).filter(
      (tag) => ["all", "presentations"].indexOf(tag) === -1,
    );
  });

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: ["md", "njk", "html", "liquid"],

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: false,

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: "njk",

    // These are all optional:
    dir: {
      input: "content", // default: "."
      includes: "../_includes", // default: "_includes"
      data: "../_data", // default: "_data"
      output: "_site",
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
