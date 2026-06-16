# Standalone Home Media Stack Guide

This guide is for building a Docker-based home media stack from scratch. You do
not need another source repo. Follow it in order and copy the file contents into
your own project.

The stack runs:

- SABnzbd for downloads.
- Prowlarr for indexers.
- Sonarr for TV automation.
- Radarr for movie automation.
- Jellyfin for playback.

The design stores large media files on a NAS and stores app configuration on
the local server disk. That keeps the apps responsive while keeping media on
shared storage.

## Before You Start

You need:

- A Linux server.
- Docker Engine and Docker Compose v2.
- The `just` command runner.
- A NAS share mounted on the Linux server.
- A Usenet provider account for SABnzbd.
- Indexer API keys for Prowlarr.

Install Docker and Compose using the official Docker docs for your Linux
distribution. Install `just` using your package manager or the official `just`
manual.

Do not put passwords, API keys, private domains, private IP addresses,
usernames, downloaded files, media files, or app databases in git.

## Folder Plan

Create one project folder on the Linux server:

```sh
mkdir -p ~/media-stack
cd ~/media-stack
```

The guide assumes these files will exist:

```text
media-stack/.env
media-stack/.env.example
media-stack/.gitignore
media-stack/docker-compose.yml
media-stack/justfile
```

## Pick Your Paths

Choose three paths:

| Name | Purpose | Example |
| --- | --- | --- |
| `BASE_PATH` | NAS folder for downloads, media, and backups | `/mnt/media` |
| `APPDATA_BASE` | Local app config/databases | `./appdata` |
| `CACHE_BASE` | Local Jellyfin cache/transcodes | `.` |

`BASE_PATH` must be a NAS mount. `APPDATA_BASE` and `CACHE_BASE` should be on
local disk.

Check your user and group IDs:

```sh
id -u
id -g
```

If you want Jellyfin GPU transcoding, also check:

```sh
ls -la /dev/dri
getent group render | cut -d: -f3
getent group video | cut -d: -f3
```

If `/dev/dri` does not exist, skip GPU transcoding for now.

## Create `.gitignore`

Create `.gitignore`:

```gitignore
.env
.env.local
appdata/
downloads/
media/
jellyfin-cache/
backups/
```

## Create `.env.example`

Create `.env.example`:

```dotenv
BASE_PATH=/mnt/media
PUID=1000
PGID=1000
TZ=America/New_York
RENDER_GID=1000
VIDEO_GID=44
APPDATA_BASE=./appdata
CACHE_BASE=.
```

Copy it to `.env`:

```sh
cp .env.example .env
```

Edit `.env` and replace values for your server:

- `BASE_PATH`: your NAS mount path.
- `PUID`: output of `id -u`.
- `PGID`: output of `id -g`.
- `TZ`: your IANA timezone.
- `RENDER_GID`: output of the `render` group command, if using GPU.
- `VIDEO_GID`: output of the `video` group command, if using GPU.
- `APPDATA_BASE`: local app config path.
- `CACHE_BASE`: local cache root.

No GPU? Keep the variables for now, but remove the `devices` and `group_add`
sections from Jellyfin in `docker-compose.yml` before starting.

## Create `docker-compose.yml`

Create `docker-compose.yml`:

```yaml
services:
  sabnzbd:
    image: lscr.io/linuxserver/sabnzbd:latest
    container_name: sabnzbd
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${BASE_PATH}:/data
      - ${APPDATA_BASE:-./appdata}/sabnzbd:/config
    ports:
      - "8080:8080"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api?mode=version"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  prowlarr:
    image: lscr.io/linuxserver/prowlarr:latest
    container_name: prowlarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${APPDATA_BASE:-./appdata}/prowlarr:/config
    ports:
      - "9696:9696"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9696/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  sonarr:
    image: lscr.io/linuxserver/sonarr:latest
    container_name: sonarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${BASE_PATH}:/data
      - ${APPDATA_BASE:-./appdata}/sonarr:/config
    ports:
      - "8989:8989"
    restart: unless-stopped
    depends_on:
      sabnzbd:
        condition: service_healthy
      prowlarr:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8989/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  radarr:
    image: lscr.io/linuxserver/radarr:latest
    container_name: radarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${BASE_PATH}:/data
      - ${APPDATA_BASE:-./appdata}/radarr:/config
    ports:
      - "7878:7878"
    restart: unless-stopped
    depends_on:
      sabnzbd:
        condition: service_healthy
      prowlarr:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7878/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    environment:
      - TZ=${TZ}
    devices:
      - /dev/dri:/dev/dri
    group_add:
      - "${RENDER_GID}"
      - "${VIDEO_GID}"
    volumes:
      - ${BASE_PATH}/media:/media
      - ${APPDATA_BASE:-./appdata}/jellyfin:/config
      - ${CACHE_BASE}/jellyfin-cache:/cache
    ports:
      - "8096:8096"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8096/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

## Create `justfile`

Create `justfile`:

```just
set dotenv-load

default:
  @just --list

check-env:
  @test -f .env || (echo "Missing .env. Run: cp .env.example .env" >&2; exit 1)
  @test -n "${BASE_PATH:-}" || (echo "BASE_PATH is not set" >&2; exit 1)
  @test -n "${PUID:-}" || (echo "PUID is not set" >&2; exit 1)
  @test -n "${PGID:-}" || (echo "PGID is not set" >&2; exit 1)
  @test -n "${TZ:-}" || (echo "TZ is not set" >&2; exit 1)
  @test -n "${APPDATA_BASE:-}" || (echo "APPDATA_BASE is not set" >&2; exit 1)
  @test -n "${CACHE_BASE:-}" || (echo "CACHE_BASE is not set" >&2; exit 1)

setup: check-env
  @mkdir -p "${BASE_PATH}/downloads/incomplete"
  @mkdir -p "${BASE_PATH}/downloads/complete/tv"
  @mkdir -p "${BASE_PATH}/downloads/complete/movies"
  @mkdir -p "${BASE_PATH}/media/tv"
  @mkdir -p "${BASE_PATH}/media/movies"
  @mkdir -p "${BASE_PATH}/backups/app-config"
  @mkdir -p "${APPDATA_BASE}/sabnzbd"
  @mkdir -p "${APPDATA_BASE}/prowlarr"
  @mkdir -p "${APPDATA_BASE}/sonarr"
  @mkdir -p "${APPDATA_BASE}/radarr"
  @mkdir -p "${APPDATA_BASE}/jellyfin"
  @mkdir -p "${CACHE_BASE}/jellyfin-cache"
  @echo "Created required folders"

up: check-env
  @docker compose up -d

down:
  @docker compose down

restart: down up

ps:
  @docker compose ps

logs:
  @docker compose logs -f
```

## Mount The NAS

The NAS must be mounted before containers start. An NFS mount usually has this
shape in `/etc/fstab`:

```fstab
<nas-host-or-ip>:<nas-export-path> <nas-mount-point> nfs defaults,_netdev,nofail,x-systemd.automount,x-systemd.mount-timeout=30 0 0
```

Ask for help here if needed. This part depends on your NAS. After editing
`/etc/fstab`, test:

```sh
sudo mount -a
mountpoint <nas-mount-point>
```

The second command should say the path is a mount point. If it does not, fix
the NAS mount before starting Docker.

## Start The Stack

Run:

```sh
just check-env
just setup
just up
just ps
```

Wait a few minutes. `just ps` should show all five containers running. Some may
take a little while to become healthy on first boot.

Open the apps in a browser at ports `8080`, `9696`, `8989`, `7878`, and
`8096` on your server.

## Configure The Apps

Configure in this order.

### 1. SABnzbd

Open `http://<server-ip-or-name>:8080`.

Add your Usenet provider details in the web UI. Do not write them into files in
this project.

Set folders:

```text
Incomplete: /data/downloads/incomplete
Complete:   /data/downloads/complete
```

Set categories:

```text
tv     -> /data/downloads/complete/tv
movies -> /data/downloads/complete/movies
```

### 2. Prowlarr

Open `http://<server-ip-or-name>:9696`.

Add your indexers using their API keys. Do not commit API keys.

Add Sonarr:

```text
URL: http://sonarr:8989
```

Add Radarr:

```text
URL: http://radarr:7878
```

The URLs above are Docker service names. They are different from the browser
URLs.

### 3. Sonarr

Open `http://<server-ip-or-name>:8989`.

Set:

```text
Root folder: /data/media/tv
Download client: SABnzbd
SABnzbd host: sabnzbd
SABnzbd port: 8080
SABnzbd category: tv
```

### 4. Radarr

Open `http://<server-ip-or-name>:7878`.

Set:

```text
Root folder: /data/media/movies
Download client: SABnzbd
SABnzbd host: sabnzbd
SABnzbd port: 8080
SABnzbd category: movies
```

### 5. Jellyfin

Open `http://<server-ip-or-name>:8096`.

Add libraries:

```text
TV:     /media/tv
Movies: /media/movies
```

For GPU transcoding, go to Jellyfin's playback/transcoding settings and enable
VA-API or the acceleration method supported by your hardware. Use
`/dev/dri/renderD128` when VA-API asks for a render device.

## Backups

At minimum, back up the local `appdata/` folder. That folder contains the app
databases and settings.

Simple manual backup:

```sh
mkdir -p "${BASE_PATH}/backups/app-config"
rsync -a --delete "${APPDATA_BASE}/" "${BASE_PATH}/backups/app-config/latest/"
```

Restore from that backup:

```sh
just down
rsync -a --delete "${BASE_PATH}/backups/app-config/latest/" "${APPDATA_BASE}/"
just up
```

## Common Problems

If Sonarr or Radarr cannot import a download, check the SABnzbd category path.
It should start with `/data/downloads/complete`.

If Jellyfin sees no media, check that files are under:

```text
${BASE_PATH}/media/tv
${BASE_PATH}/media/movies
```

If the stack starts before the NAS is mounted, stop the stack, mount the NAS,
and start again:

```sh
just down
sudo mount -a
just up
```

If Docker says it cannot use `/dev/dri`, remove the Jellyfin `devices` and
`group_add` sections and start without GPU transcoding.

## Final Checklist

You are done when:

- `just check-env` passes.
- `just setup` creates folders.
- The NAS path is mounted.
- `just up` starts all five containers.
- `just ps` shows the containers running.
- SABnzbd downloads to `/data/downloads`.
- Sonarr uses `/data/media/tv`.
- Radarr uses `/data/media/movies`.
- Jellyfin uses `/media/tv` and `/media/movies`.
- No credentials or API keys are committed.
