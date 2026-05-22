import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

export function renderHomePage() {
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Markdown Share</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-50 text-slate-950">
    <main class="mx-auto max-w-2xl px-6 py-10">
      <h1 class="text-3xl font-bold">Markdown Share Server</h1>
      <p class="mt-4 text-slate-700">Markdown per POST speichern:</p>
      <pre class="mt-4 overflow-x-auto rounded bg-slate-900 p-4 text-sm text-slate-100">curl -X POST http://localhost:3000/markdown \\
  -H 'content-type: text/markdown' \\
  --data-binary '# Hallo Welt'</pre>
    </main>
  </body>
</html>`
}

export function renderMarkdownPage(id: string, markdown: string) {
  const html = md.render(markdown)

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Markdown ${id}</title>
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
  </head>
  <body class="bg-slate-50 text-slate-950">
    <main class="mx-auto max-w-3xl px-6 py-10">
      <nav class="mb-8 flex items-center justify-between text-sm text-slate-600">
        <a class="font-medium hover:text-slate-950" href="/">Markdown Share</a>
        <a class="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700" href="/${id}/raw">Raw</a>
      </nav>
      <article class="prose prose-slate max-w-none rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        ${html}
      </article>
    </main>
  </body>
</html>`
}
