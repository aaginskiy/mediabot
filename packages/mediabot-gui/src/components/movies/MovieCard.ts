import { computed, createComponent, ref, watch } from '@vue/composition-api'

export default createComponent({
  name: 'MovieCard',
  props: {
    movie: {
      type: Object,
      required: true,
    },
  },
  setup(props, context) {
    const { Job } = context.root.$FeathersVuex.api
    const refreshMovieLoading = ref(false)
    const autoFixMovieLoading = ref(false)

    let autoFixMovieJob = new Job({
      name: 'autoFixMovie',
      progress: 0,
      status: 'queued',
      args: [props.movie.id, props.movie.filename],
    })

    const progress = computed(() => {
      return autoFixMovieJob.progress === 0 ? 100 : autoFixMovieJob.progress
    })

    watch(
      () => props.movie.isRunning,
      (newVal, oldVal) => {
        if (!newVal?.refreshMovie && oldVal?.refreshMovie)
          refreshMovieLoading.value = false

        if (!newVal?.autoFixMovie && oldVal?.autoFixMovie) {
          autoFixMovieLoading.value = false
          autoFixMovieJob = new Job({
            name: 'autoFixMovie',
            progress: 0,
            status: 'queued',
            args: [props.movie.id, props.movie.filename],
          })
        }
      }
    )

    async function refreshMovie() {
      refreshMovieLoading.value = true
      const refreshMovieJob = new Job({
        name: 'refreshMovie',
        progress: 0,
        status: 'queued',
        args: [props.movie.id, props.movie.filename],
      })
      refreshMovieJob.save()
    }

    async function autoFixMovie() {
      autoFixMovieLoading.value = true
      autoFixMovieJob.save()
    }

    return {
      refreshMovie,
      refreshMovieLoading,
      autoFixMovie,
      autoFixMovieLoading,
      progress,
    }
  },
})
