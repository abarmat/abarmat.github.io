const htmlmin = require("html-minifier");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const cacheBuster = require("@mightyplow/eleventy-plugin-cache-buster");

module.exports = function (eleventyConfig) {
  // Add cache buster plugin
  eleventyConfig.addPlugin(cacheBuster({
    outputDirectory: "dist",
  }));

  // Add RSS plugin
  eleventyConfig.addPlugin(pluginRss);

  // Date filter
  eleventyConfig.addFilter("dateFilter", function (date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  });

  eleventyConfig.addFilter("descriptionFromHtml", function (html, maxLength = 250) {
    const source = String(html ?? "");
    const bodyMatch = source.match(/<!-- post-body-start -->([\s\S]*?)<!-- post-body-end -->/);
    const entities = {
      "&amp;": "&",
      "&apos;": "'",
      "&#39;": "'",
      "&gt;": ">",
      "&lt;": "<",
      "&nbsp;": " ",
      "&quot;": '"',
    };

    const text = (bodyMatch ? bodyMatch[1] : source)
      .replace(/<img\b[^>]*>/gi, " ")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&(amp|apos|#39|gt|lt|nbsp|quot);/g, (entity) => entities[entity] ?? " ")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length <= maxLength) {
      return text;
    }

    const excerpt = text.slice(0, maxLength + 1);
    const wordBoundary = excerpt.lastIndexOf(" ");

    return (wordBoundary > 80 ? excerpt.slice(0, wordBoundary) : text.slice(0, maxLength)).trim();
  });

  // Minify HTML output
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
      });
    }
    return content;
  });

  // Pass through copy for CSS and assets
  eleventyConfig.ignores.add("src/assets/**/*.md");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("CNAME");

  // Blog post collection
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByTag("post").reverse();
  });

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
    },
    // Add metadata for RSS feed
    dataTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md"],
  };
};
