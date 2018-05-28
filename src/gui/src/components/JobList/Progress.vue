<template>
  <div class="field is-grouped">
    <span class="control is-expanded">
      <progress class="progress is-primary"
        :value="progressState" max="100">{{ progressState }}%</progress>
    </span>
    <div class="control">
      {{ progressState }}%
    </div>
  </div>
</template>

<script>
import Vuetable from 'vuetable-2';

export default {
  name: 'expand-icon',
  components: {
    Vuetable,
  },
  props: {
    rowData: {
      type: Object,
      required: true,
    },
    rowIndex: {
      type: Number,
    },
  },
  computed: {
    progressState() {
      return this.rowData.progress;
    },
  },
};
</script>

<style>
</style>
