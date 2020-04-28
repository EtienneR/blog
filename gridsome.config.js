// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
//   .BundleAnalyzerPlugin

module.exports = {
  // chainWebpack: config => {
  //   config
  //     .plugin('BundleAnalyzerPlugin')
  //     .use(BundleAnalyzerPlugin, [{ analyzerMode: 'static' }])
  // },
  siteName: "https://etienner.github.io",
  titleTemplate: `%s - https://etienner.github.io`,
  siteUrl: "https://etienner.github.io",
  transformers: {
    remark: {
      externalLinksTarget: "_blank",
      externalLinksRel: ["nofollow", "noopener", "noreferrer"],
      slug: false,
      plugins: [
        [
          "gridsome-plugin-remark-prismjs-all",
          {
            aliases: {},
            noInlineHighlight: false,
            showLineNumbers: true,           
          }
        ]
      ]
    }
  },

  templates: {
    Tag: [
      {
        path: "/tag/:id",
        component: "./src/templates/Tag.vue"
      }
    ]
  },

  plugins: [
    {
      use: "@gridsome/source-filesystem",
      options: {
        typeName: "Post",
        path: "blog/**/*.md",
        route: "/:title",
        refs: {
          tags: {
            typeName: "Tag",
            create: true
          }
        }
      }
    },
    {
      use: "@gridsome/plugin-sitemap",
      config: {
        "/*": {
          changefreq: "monthly",
          priority: 0.7
        }
      }
    },
    {
      use: "@gridsome/plugin-google-analytics",
      options: {
        id: "UA-31893272-1"
      }
    }
  ]
};
