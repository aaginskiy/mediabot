# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.1.0"></a>
# 0.1.0 (2018-05-28)


### Bug Fixes

* **api:** check for existence of nested properties in mkvmerge info parsing ([430e8b4](https://github.com/aaginskiy/mediabot/commit/430e8b4))
* **api:** clean up filename handling in #_readMovieInfo and #create for media-file service ([8ada8e8](https://github.com/aaginskiy/mediabot/commit/8ada8e8))
* **api:** create config directory if one does not exist ([53a299b](https://github.com/aaginskiy/mediabot/commit/53a299b))
* **api:** split data location for test and normal execution ([cb551b8](https://github.com/aaginskiy/mediabot/commit/cb551b8))


### Features

* **api:** add #find and #get for media-file service ([e586770](https://github.com/aaginskiy/mediabot/commit/e586770))
* **api:** add basic TMDB movie scraper ([a732247](https://github.com/aaginskiy/mediabot/commit/a732247))
* **api:** add check-mux hook to check if movie needs muxing and mkvmerge command generation ([7d05d9c](https://github.com/aaginskiy/mediabot/commit/7d05d9c))
* **api:** add framework for app configuration file ([b5f526a](https://github.com/aaginskiy/mediabot/commit/b5f526a))
* **api:** add mkvpropedit functionality on save ([cc44b2b](https://github.com/aaginskiy/mediabot/commit/cc44b2b))
* **api:** add Radarr webhook support ([da99cd6](https://github.com/aaginskiy/mediabot/commit/da99cd6))
* **api:** add settings service to manage program settings ([b2550b9](https://github.com/aaginskiy/mediabot/commit/b2550b9))
* **api:** add summary media tags when loading metadata from file ([55201ce](https://github.com/aaginskiy/mediabot/commit/55201ce))
* **api:** generate mkvmerge command and execute in shell ([6bb112a](https://github.com/aaginskiy/mediabot/commit/6bb112a))
* **api:** load list of files and artwork in the movie directory ([ad0dd4f](https://github.com/aaginskiy/mediabot/commit/ad0dd4f))
* **api:** replace REST connectivity with real-time Socket.io ([d0bdd60](https://github.com/aaginskiy/mediabot/commit/d0bdd60))


### Performance Improvements

* **api:** load and store each metadata individually, rather than load all then store all ([d77aada](https://github.com/aaginskiy/mediabot/commit/d77aada))
