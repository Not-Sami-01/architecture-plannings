#!/usr/bin/env sh
# Prisma spawns the seed command without a shell, so inline `VAR=... cmd`
# syntax fails. The seed imports `src/config/config.ts`, which is `server-only`;
# that package only resolves under the `react-server` condition.
export NODE_OPTIONS="--conditions=react-server"
exec tsx prisma/seed.ts
