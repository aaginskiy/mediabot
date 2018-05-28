<template>
  <div class="custom-actions">
    <a class="button is-success is-small" @click="itemAction('run-item', rowData, rowIndex)">
      <span class="icon">
        <i class="fas fa-play"></i>
      </span>
      <span>Run</span>
    </a>
    <a class="button is-danger is-small" @click="removeJob(rowData._id)">
      <span class="icon">
        <i class="fas fa-trash"></i>
      </span>
      <span>Delete</span>
    </a>
  </div>
</template>

<script>
export default {
  name: 'custom-actions',
  props: {
    rowData: {
      type: Object,
      required: true,
    },
    rowIndex: {
      type: Number,
    },
  },
  methods: {
    removeJob(id) {
      this.$store.dispatch('jobs/remove', id);
    },
  },
};
</script>

<style>
  .custom-actions button.ui.button {
    padding: 8px 8px;
  }
  .custom-actions button.ui.button > i.icon {
    margin: auto !important;
  }
</style>
