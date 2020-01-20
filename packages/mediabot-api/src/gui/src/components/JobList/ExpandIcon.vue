<template>
  <div class="expand-icon">
    <template  v-if="expandState">
      <span class="icon">
        <i class="fas fa-angle-down is-medium"></i>
      </span>
    </template>
    <template  v-else>
      <span class="icon">
        <i class="fas fa-angle-right is-medium"></i>
      </span>
    </template>
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
    expandState() {
      console.log(this.$parent.$parent.$refs.vuetable.isVisibleDetailRow(this.rowData._id));
      return this.$parent.$parent.$refs.vuetable.isVisibleDetailRow(this.rowData._id);
    },
  },
};
</script>

<style>
</style>
