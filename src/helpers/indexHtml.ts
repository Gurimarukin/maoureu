import { StringUtils } from '../utils/StringUtils'

export type IndexHtmlArgs = {
  readonly title: string
  readonly appCss: string
  readonly content: string
}

export const indexHtml = ({ title, appCss, content }: IndexHtmlArgs): string =>
  StringUtils.stripMargins(
    `<!DOCTYPE html>
    |<html lang="fr">
    |  <head>
    |    <meta charset="utf-8" />
    |    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    |    <title>${title}</title>
    |    <link rel="stylesheet" href="${appCss}" />
    |  </head>
    |  <body>
    |    ${content}
    |  </body>
    |</html>`,
  )
