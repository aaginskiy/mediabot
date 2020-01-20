<template>
  <div>
    <router-link :to="{ name: 'jobs', params: { id: job._id } }"
     class="panel-block" style="display: block;" active-class="is-active">
    <div class="columns is-multiline">
      <div class="column is-two-thirds"
            v-bind:class="{ 'is-italic': !job.title, 'has-text-weight-bolder': job.title }">
        <p class="title is-6">
          {{ job.title ? job.title : 'Untitled' }}
        </p>
      </div>
      <div class="column is-one-third has-text-right">
      </div>
      <div class="column is-italic">
        <p class="subtitle is-7">{{ job.filename }}</p>
      </div>
    </div>
  </router-link>
  </div>
</template>

<script>
export default {
  props: ['job', 'id'],
};
</script>

<style scoped>
.panel-block {
  border-right-color: transparent;
  border-left-color: transparent;
  border-right-width: 6px;
  border-left-width: 6px;
}
.panel-block.is-unsaved {
  border-left-color: #ff3860;
  border-left-width: 6px;
}
.panel-block.is-active {
  border-right-color: #7957d5;
  border-right-width: 6px;
}
</style>
