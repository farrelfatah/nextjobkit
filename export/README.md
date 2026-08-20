# Resume Export

Next Job Kit renders Markdown through the selected template in `profile/candidate.md`.

The current release includes one built-in, `classic-timeline`, registered in `export/templates.json`. Its HTML and CSS hashes are locked in `export/template-baseline.json`. User customizations fork into `export/custom-templates/<template-id>/`; those files are user-owned and are not part of the built-in hash baseline.

Most users should ask their agent:

> Export my configured resume as a PDF, validate it, and show me the final result.

The agent handles export, structural validation, and visual inspection before returning the finished PDF.

## Agent and Maintainer Commands

These commands document the underlying implementation. Regular users do not need to run them directly.

```sh
npm run export:resume -- --pdf
npm run export:resume -- path/to/tailored-resume.md --pdf
npm run preview:resume
npm run validate:template
npm run validate:pdf -- path/to/resume.pdf
```

Without an input path, preview and export resolve the configured master resume.

## Browser Behavior

PDF export chooses a renderer in this order:

1. `NEXT_JOB_KIT_CHROME_PATH`, when explicitly set.
2. The newest Playwright Chrome Headless Shell found in the local cache.
3. Installed Google Chrome, Chromium, or Microsoft Edge.

Every export uses a disposable browser profile plus headless, first-run, and crash-reporter suppression flags. The temporary profile is removed afterward.

Agents running in a browser sandbox may need permission to launch Chrome. Request that permission; do not change PDF renderers.

## Final QA

Structural validation confirms A4 sizing, Chrome/Skia production, a maximum of two pages, extractable text, and expected sections. It does not prove the layout is good. Render and inspect every page before delivering a PDF.
