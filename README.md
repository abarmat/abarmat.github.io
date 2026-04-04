# Personal Site

### Dev

```
just dev
```

### Build

```
just build
```

### Test

```
just test
```

### Install

```
just install
```

### Install Security

- `bun install` runs Socket scanner checks before packages are installed
- New packages must be at least 7 days old by default
- Optional: set `SOCKET_API_KEY` to use authenticated Socket org settings; otherwise installs run in free mode

### Drafts

- Keep local drafts in `src/drafts/`
- `bun run build` blocks unexpected untracked content under `src/`

### Provenance

- The built site footer shows the published short commit hash

### Assets

- Avatar image uses committed `1x/2x/3x` variants in `src/assets/images/`
- Replace those variants when updating `src/assets/images/avatar.jpg` or the favicon

### Deploy

```
just deploy
```
