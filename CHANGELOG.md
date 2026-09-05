# Changelog

## [0.1.4](https://github.com/tysongoulding/SyntropyOS/compare/v0.1.3...v0.1.4) (2026-09-05)


### Features

* add xAI SpaceX Grok, OAuth PKCE for Google & OpenAI, strict dynamic model replacement, and chat dropup hot sync ([c8db652](https://github.com/tysongoulding/SyntropyOS/commit/c8db652cca0683b6a92f0ccc23c722f09708aac6))
* **customise:** revamp Plugins tab with dense OAuth integrations and checkmark pills ([0710a94](https://github.com/tysongoulding/SyntropyOS/commit/0710a945295d5e7ab902d21b9eeb8f536978740e))
* discover live models from API endpoints and cache across backend disk and client storage ([49990ef](https://github.com/tysongoulding/SyntropyOS/commit/49990ef507b25af109fff40c2fdc25494e66e494))
* dynamic provider model discovery from API key and expanded model catalog ([910fab4](https://github.com/tysongoulding/SyntropyOS/commit/910fab4776a8c0fdfeee01074864e86672f8634f))
* **editor:** add Cursor-style agent and categorized model pickers with Gemini 3.x/2.x support ([ba13323](https://github.com/tysongoulding/SyntropyOS/commit/ba13323c600a3cc0030597498c7d2ac167983133))
* embedded sqlite blackboard, native jit tools, and hardened mobile pipeline ([#6](https://github.com/tysongoulding/SyntropyOS/issues/6)) ([c47ab5a](https://github.com/tysongoulding/SyntropyOS/commit/c47ab5a003a5df3a61fc7ba18b9a7f7b40727695))
* enforce rich markdown & mermaid responses across all providers with full chat rendering support ([207036a](https://github.com/tysongoulding/SyntropyOS/commit/207036a100bb271735f3b24038821270618f39a4))
* style chat conversation like antigravity with flat canvas AI responses and single user bubble ([be736be](https://github.com/tysongoulding/SyntropyOS/commit/be736be5b9dda0dde3cc314d3335fadda546abe2))


### Bug Fixes

* **gemini:** implement test_provider_key, get_saved_auth_keys, load_lota_settings, and live Gemini streaming ([e298d4b](https://github.com/tysongoulding/SyntropyOS/commit/e298d4bbf44c3f605e5168ee37989d9de95e57d2))
* **gemini:** purge hallucinated 2.5 and 3.x model identifiers and align with official Gemini 2.0/1.5 API lineup ([32059d1](https://github.com/tysongoulding/SyntropyOS/commit/32059d169bfab08099244d91e601e04391acc76e))
* prune deprecated gemini-2.5-pro, add live generateContent test probe and automatic in-flight model failover ([533210e](https://github.com/tysongoulding/SyntropyOS/commit/533210e76744a32a88bb596ae8e44f91ff707c96))
* spawn blackboard writer actor on dedicated OS thread to prevent runtime panic ([#8](https://github.com/tysongoulding/SyntropyOS/issues/8)) ([d50ba21](https://github.com/tysongoulding/SyntropyOS/commit/d50ba21f9a652d4f6dbac6b8625db534c143337e))
* stabilize mermaid diagram rendering and eliminate virtualizer auto-scroll jitter ([937ee81](https://github.com/tysongoulding/SyntropyOS/commit/937ee81e00e340def6d92dce9dc5b182bf85e42b))
* **startup:** eliminate 30s WPAD devUrl delay and initial white canvas flash ([e46a401](https://github.com/tysongoulding/SyntropyOS/commit/e46a401f3daddd6c19c21feec65a550cd0b369ff))
* **ui:** synchronize Titlebar and app views with dynamic release version ([ed89f05](https://github.com/tysongoulding/SyntropyOS/commit/ed89f05146ecd552c0710e9e4b1811f9eed23175))
* **vite:** ignore target, src-tauri, and crates in file watcher to prevent EBUSY locks ([8b546cc](https://github.com/tysongoulding/SyntropyOS/commit/8b546cc3c43494725804c54ae8882a4691e67e04))

## [0.1.3](https://github.com/tysongoulding/SyntropyOS/compare/v0.1.2...v0.1.3) (2026-09-05)


### Features

* add Android and iOS release build runners to GitHub Actions ([#4](https://github.com/tysongoulding/SyntropyOS/issues/4)) ([e83de75](https://github.com/tysongoulding/SyntropyOS/commit/e83de75315ecea298d05086126a2acb67bb986f4))

## [0.1.2](https://github.com/tysongoulding/SyntropyOS/compare/v0.1.1...v0.1.2) (2026-09-04)


### Features

* verify automated CI gates and release workflow ([#2](https://github.com/tysongoulding/SyntropyOS/issues/2)) ([f0265b2](https://github.com/tysongoulding/SyntropyOS/commit/f0265b2c0ce19bb66500dd8ed6f10db4fa8ef7b0))

## [0.1.1](https://github.com/tysongoulding/SyntropyOS/compare/v0.1.0...v0.1.1) (2026-09-04)


### Features

* add descriptions for all prompts, replace company rules with workstream rules, and add project and team selectors ([0b38ae8](https://github.com/tysongoulding/SyntropyOS/commit/0b38ae8bcff5702c4164d7cc6c45308f1e5c5efd))
* bind Vite server to 0.0.0.0 to enable local network access from mobile devices ([f9ebcdb](https://github.com/tysongoulding/SyntropyOS/commit/f9ebcdb8cb124534b19826de0622b740a1dc04e3))
* complete SyntropyOS v0.6.0 native runtime, blackboard engine, and tri-color desktop UI ([8b4244b](https://github.com/tysongoulding/SyntropyOS/commit/8b4244bf4cbb0cf0a2901d56fafa4ba61c38b5d8))
* consolidate agent personas, props, and dual-mode prompt protection directly into Rules ([e9caaaf](https://github.com/tysongoulding/SyntropyOS/commit/e9caaaf75a611dcf3c2cc19ded2037c3740cca9e))
* enforce Default (Proprietary Engine) across all rules with confirmation warning modal and return to default ([6fe4543](https://github.com/tysongoulding/SyntropyOS/commit/6fe4543ce8ea290929007002361758001cf2e709))
* implement system prompt protection and orchestration dual-plane architecture specifications ([c4c631e](https://github.com/tysongoulding/SyntropyOS/commit/c4c631eee9ee3aaacdc84621a08f13756ffaf399))
* pre-populate full production defaults across all agent options, props, and personas in Rules ([a1901c4](https://github.com/tysongoulding/SyntropyOS/commit/a1901c457e343957afdc942101347256183dae34))
* reorder categories (Core Prompts -&gt; Layered Rules -&gt; Agent Personas) and add Default (De Facto) vs Custom/Plugin tags ([526de2e](https://github.com/tysongoulding/SyntropyOS/commit/526de2e62e15b3561a254ad0603357f8df04aef7))
