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

deploy:
  bun run deploy
