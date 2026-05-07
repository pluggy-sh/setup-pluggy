# setup-pluggy

Install the [pluggy](https://github.com/pluggy-sh/pluggy) CLI on a GitHub Actions runner.

## Usage

Add the action to a workflow before any step that runs `pluggy`.

```yaml
- uses: pluggy-sh/setup-pluggy@v1
- run: pluggy build
```

Pin a specific version when reproducibility matters.

```yaml
- uses: pluggy-sh/setup-pluggy@v1
  with:
    pluggy-version: '0.2.3'
```

## Inputs

| Input | Default | Description |
|---|---|---|
| `pluggy-version` | `latest` | Version of pluggy to install. Accepts an exact version like `0.2.3` or `latest`. |
| `cache` | `true` | Restore the pluggy data directory between runs and save it again at the end of the job. |
| `cache-key-prefix` | `pluggy` | Prefix for the data-directory cache key. Bump it to invalidate the cache. |
| `github-token` | `${{ github.token }}` | Token used to query the GitHub releases API. |

## Outputs

| Output | Description |
|---|---|
| `pluggy-version` | The exact pluggy version that was installed. |
| `pluggy-path` | Absolute path to the installed pluggy binary. |
| `cache-hit` | Whether the data-directory cache was restored. |

## Caching

The action restores pluggy's data directory at the start of the job and saves it at the end. The cache key is `${prefix}-${platform}-${version}`, with a fallback restore key of `${prefix}-${platform}-` so a partial cache from a previous version still helps a fresh install.

The data directory varies by OS:

- macOS: `~/Library/Caches/pluggy`
- Linux: `$XDG_CACHE_HOME/pluggy` (defaulting to `~/.cache/pluggy`)
- Windows: `%LOCALAPPDATA%/pluggy/cache`

Set `cache: false` to skip caching, for example in jobs that intentionally exercise a clean install.

## Development

The action is written in TypeScript and bundled with `@vercel/ncc` into a single `dist/index.js` that GitHub Actions runs directly.

```bash
npm install
npm run typecheck
npm run build       # produces dist/index.js
```

The `dist/` bundle is committed to the repository because GitHub Actions runs the action by checking out the ref and executing the entry file directly.

## License

MIT.
