let fg = jest.requireActual('fast-glob')

const backupSync = fg.sync

fg = jest.fn().mockImplementation((patterns, options?) => {
  switch (patterns) {
    case '/movies/**/*.mkv':
      return [
        '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).mkv',
        '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
      ]
    default:
      return backupSync(patterns, options)
  }
})

module.exports = fg
