import { useGet } from 'feathers-vuex'
import { createComponent, ref } from '@vue/composition-api'

export default createComponent({
  name: 'SingleMovie',
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props, context) {
    const { Movie } = context.root.$FeathersVuex.api
    const tab = ref(null)

    const headers = [
      {
        text: 'Title',
        value: 'title',
      },
      { text: 'Language', value: 'language' },
      { text: 'Track Type', value: 'trackType' },
      { text: 'Codec', value: 'codecType' },
      { text: 'Audio Channels', value: 'audioChannels' },
      { text: 'BPS', value: 'bps' },
      { text: 'isDefault', value: 'isDefault' },
      { text: 'isEnabled', value: 'isEnabled' },
      { text: 'isForced', value: 'isForced' },
      { text: 'isMuxed', value: 'isMuxed' },
    ]

    const { item: movie, isPending } = useGet({
      model: Movie,
      id: props.id,
    })
    return {
      movie,
      isPending,
      tab,
      headers,
    }
  },
})
