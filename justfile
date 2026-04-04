set shell := ["zsh", "-cu"]

default:
  @just --list

install:
  bun install

dev:
  bun run dev

build:
  bun run build

test:
  bun run test

spellcheck:
  bun run spellcheck

serve:
  bun run build && bunx serve dist

deploy:
  bun run deploy
