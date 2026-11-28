# Changelog

## [1.0.10](https://github.com/yepifantsev/The-Space-Index/compare/v1.0.9...v1.0.10) (2026-11-28)

### Bug Fixes

* hotfix [#2](https://github.com/yepifantsev/The-Space-Index/issues/2) to address stale cache blocking panels data ([82ac80e](https://github.com/yepifantsev/The-Space-Index/commit/82ac80ef16335ccd59b82b9b41fcba01b0c3785e))

## [1.0.9](https://github.com/yepifantsev/The-Space-Index/compare/v1.0.8...v1.0.9) (2026-11-28)

### Bug Fixes

* addressing prod cache issue for Panels using cached files in old format ([d39cf32](https://github.com/yepifantsev/The-Space-Index/commit/d39cf32edb3810d7f81211fe003085aaf7aa41fd))

## [1.0.8](https://github.com/yepifantsev/The-Space-Index/compare/v1.0.7...v1.0.8) (2026-11-28)

### Bug Fixes

* removed raw email from description ([a6d3b02](https://github.com/yepifantsev/The-Space-Index/commit/a6d3b02fbc67fddb2d0b06f86c71b4c01821da60))

### Code Refactoring

* cleanup mostly complete, aside from shared JS helpers ([c9fd10f](https://github.com/yepifantsev/The-Space-Index/commit/c9fd10f4a9663383961bec3bfb35cc01367c82f6))
* final refactor with split of remaining section-helpers info files more closely related to panels they serve ([07ac1b2](https://github.com/yepifantsev/The-Space-Index/commit/07ac1b2351d52e537ed54e62b9dd17282c1026e4))
* pilot conversion of 2 cards to confirm the process works ([6584be4](https://github.com/yepifantsev/The-Space-Index/commit/6584be44ad7631ecdbadf064bbc60512adc67d90))
* preparing for Panels rafactor into Vue ([0017e46](https://github.com/yepifantsev/The-Space-Index/commit/0017e46967c05d89e20ec3000358f1246a8a937d))
* refactored all panels with charts to Vue components ([6b1760d](https://github.com/yepifantsev/The-Space-Index/commit/6b1760d630f2208e55e0c8261221f8ad537d8a4f))
* refactored the rest of sections to Panels ([2eaa771](https://github.com/yepifantsev/The-Space-Index/commit/2eaa771d1e3f709bcbf1a8d517afc7e5f95a0e9e))
* renamed a few sections across the codebase ([4f4d45f](https://github.com/yepifantsev/The-Space-Index/commit/4f4d45f0672acc3b24c90ab11ae29308fc66b5c5))
* split panel helper functions out of section-helpers.js into panel-helpers.js ([a236728](https://github.com/yepifantsev/The-Space-Index/commit/a236728177c42f5ad6651a2a5b55b76a399abce0))

### Miscellaneous Chores

* release v1.0.7 ([88c0398](https://github.com/yepifantsev/The-Space-Index/commit/88c0398582e7eecaed384b701e690fd5c06cae3d))
* **release:** include refactor commits in changelog and auto-add CHANGELOG.md manual changes ([f7743da](https://github.com/yepifantsev/The-Space-Index/commit/f7743da7170750a251a3fdbe138d3afa951a2b6a))

### Build System

* add Vue runtime and Vite Vue plugin ([38b900a](https://github.com/yepifantsev/The-Space-Index/commit/38b900ae6c7293c2639e8232694f85da8ed2c528))

## [1.0.7](https://github.com/yepifantsev/The-Space-Index/compare/v1.0.6...v1.0.7) (2026-11-27)

### Bug Fixes

* moon above/below horizon logic fix; footer layout correction for mobile ([23b9fd0](https://github.com/yepifantsev/The-Space-Index/commit/23b9fd003be9c77ca194de2d459573de80aaa6dd))

### Refactoring

* refactored all remaining panels code into new formatter dir structure and files naming; added raw and processed JSON data caching; moved out resusable functions form sections.js to clean up main panels file [2125eda6d2cd3b169ce6ee1dcebde75413142b41]
* refactor to move all fetcher files into new structure [baf4f91a1bdc0b48e1687bb4b31ea6c4972e6663]
* moved fornatters to new dir structure [c43efee824851470d7192d523925b7612926c119]
* refactor to splits panel data fetching from UI [25277a9006b210d040d442554509ae7557093ff4]
* pilot run to refactor moon data fathching from processing from UI [c4be82163afeefe947fc61b758e2e35dd3ce1e44]
* refactoring work in progress [5f3745c685d6373b2140326b393fb862afe712b7]
* refactored sections reusable functions into separare file [d1c06bc88ae3240082ea466b9f14d954425d980b]
