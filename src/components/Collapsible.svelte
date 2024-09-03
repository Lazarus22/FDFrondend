<script lang="ts">
  export let isCollapsed: boolean;
  export let onToggle: () => void;
</script>

<div class="collapsible">
  <button on:click={onToggle}>{isCollapsed ? 'Expand' : 'Collapse'}</button>
  {#if !isCollapsed}
    <slot></slot>
  {/if}
</div>

<style>
  .collapsible button {
    margin-bottom: 10px;
  }
</style>
