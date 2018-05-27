// eslint-disable-next-line no-unused-vars
const { filter } = require('lodash');

module.exports = function (options = {}) {
  return async context => {
    context.app.debug(`Populating media info tags for movie #${context.id}`, { label: "PopulateMediaTagsHook"});
    
    function legibleTag(tag) {
      let legibleTag;

      switch(tag) {
        default:
          legibleTag = tag;
      }

      return legibleTag;
    }

    let defaultVideoTracks = filter(context.data.tracks, { type: 'video', isDefault: true });
    let defaultAudioTracks = filter(context.data.tracks, { type: 'audio', isDefault: true });

    if (defaultVideoTracks[0]) context.data.videoTag = legibleTag(defaultVideoTracks[0].codecType);
    if (defaultAudioTracks[0]) context.data.audioTag = `${legibleTag(defaultAudioTracks[0].codecType)} ${defaultAudioTracks[0].audioChannels}ch`;

    return context;
  };
};
