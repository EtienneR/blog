// This is where project configuration and plugin options are located. 
// Learn more: https://gridsome.org/docs/config

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

module.exports = {
  siteName: 'https://etienner.github.io',
  pathPrefix: '/blog',
  titleTemplate: `%s - https://etienner.github.io/blog`,
  siteUrl: 'https://etienner.github.io',

  transformers: {
    remark: {
      externalLinksTarget: '_blank',
      externalLinksRel: ['nofollow', 'noopener', 'noreferrer'],
      anchorClassName: 'icon icon-link',
      plugins: [
        '@gridsome/remark-prismjs'
      ]
    }
  },

  plugins: [
    {
      use: "@gridsome/source-filesystem",
      options: {
        typeName: "Post",
        path: "blog/**/*.md",
        route: '/:title'
      }
    },
    {
      use: '@gridsome/plugin-sitemap',
      config: {
        '/*': {
          changefreq: 'monthly',
          priority: 0.7
        }
      }
    },
    {
      use: '@gridsome/plugin-google-analytics',
      options: {
        id: 'UA-31893272-1'
      }
    }
  ]
}
