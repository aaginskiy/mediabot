import { useFind } from 'feathers-vuex'
import { computed, ref, watch, createComponent } from '@vue/composition-api'
import MovieCard from '../components/movies/MovieCard.vue'

export default createComponent({
  name: 'Movies',
  components: {
    MovieCard,
  },
  props: {
    id: {
      type: String,
      required: false,
    },
  },
  setup(props, context) {
    const { Movie, Job } = context.root.$FeathersVuex.api

    const scanMediaLibraryJob = ref(
      new Job({
        name: 'scanMediaLibrary',
        args: [],
        progress: 0,
        status: 'queued',
      })
    )

    const scanMediaLibraryJobLoading = ref(false)

    watch(
      () => scanMediaLibraryJob.value.status,
      (status, prevStatus) => {
        if (!prevStatus?.match('completed') && !!status?.match('completed')) {
          scanMediaLibraryJobLoading.value = false
          scanMediaLibraryJob.value = new Job({
            name: 'scanMediaLibrary',
            args: [],
            progress: 0,
            status: 'queued',
          })
        }
      }
    )

    // Messages
    const moviesParams = computed(() => {
      return {
        query: {
          $sort: { title: 1 },
        },
      }
    })

    const { items: movies, isPending: isPending, haveLoaded } = useFind({
      model: Movie,
      params: moviesParams,
    })

    async function scanMediaLibrary() {
      scanMediaLibraryJobLoading.value = true
      scanMediaLibraryJob.value.save()
    }

    return {
      scanMediaLibrary,
      scanMediaLibraryJob,
      scanMediaLibraryJobLoading,
      movies,
      isPending,
      haveLoaded,
    }
  },
})
