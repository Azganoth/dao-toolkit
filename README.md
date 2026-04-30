# DAO Toolkit

DAO Toolkit is a Windows desktop app for managing Dragon Age: Origins mods.

Version 1.0 focuses on chargen workflows: scanning custom character creation
assets, reviewing resources, excluding unwanted entries, and generating
`chargenmorphcfg.xml` files for the selected override folder.

## Features

- Configure the Dragon Age: Origins override directory.
- Scan custom chargen assets from loose override files.
- Review detected heads, hairs, beards, eyes, skin tints, hair tints, and makeup.
- Group inspector resources by detected mod folder, with saved grouping rules.
- Exclude resources before generation.
- Review and clear stale exclusions when files disappear.
- Delete all `chargenmorphcfg.xml` files from the override folder to prevent conflicts.
- Generate `chargenmorphcfg.xml` from the current scan snapshot.
- Persist settings, theme, reduced-motion preference, exclusions, and grouping
  rules.

## Development

### Prerequisites

- Node.js
- Rust
- pnpm

### Commands

```bash
pnpm install
pnpm tauri dev
pnpm tauri build
```

Useful checks:

```bash
pnpm lint
pnpm format
```

## License

This project is licensed under the [MIT License](./LICENSE).
