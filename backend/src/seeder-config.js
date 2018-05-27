module.exports = {
  services: [
    {
      path: 'movies',
      count: 3,
      delete: true,
      template: {
        title: '{{lorem.slug}}',
        filename: '{{system.commonFileName}}.mkv'
        // type: '{{random.arrayElement(["audio", "video", "subtitles"])}}'
      }
    }
  ]
}
