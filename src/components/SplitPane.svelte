<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let leftInitialSize = '75%';

	let left: HTMLDivElement | null = null;
	let isDragging = false;

	// Create an event dispatcher
	const dispatch = createEventDispatcher();

	function dragstart(event: MouseEvent) {
		event.preventDefault();
		isDragging = true;
		document.addEventListener('mousemove', drag);
		document.addEventListener('mouseup', dragend);
	}

	function drag(event: MouseEvent) {
		if (!isDragging || !left) return;

		const containerWidth = left.parentElement?.offsetWidth || 0;
		const newLeftWidth =
			((event.clientX - (left.parentElement?.getBoundingClientRect().left || 0)) / containerWidth) *
			100;

		// Ensure the panes don't collapse
		if (newLeftWidth < 10) {
			left.style.width = '10%';
		} else if (newLeftWidth > 90) {
			left.style.width = '90%';
		} else {
			left.style.width = `${newLeftWidth}%`;
		}

		// Dispatch a resize event with the new width
		dispatch('resize', { width: left.style.width });
	}

	function dragend() {
		isDragging = false;
		document.removeEventListener('mousemove', drag);
		document.removeEventListener('mouseup', dragend);
	}
</script>

<div class="split-pane" role="group">
  <div bind:this={left} class="left-pane" style="width: {leftInitialSize};">
    <slot name="left" />
  </div>
  <button class="splitter" aria-label="Resize panel" on:mousedown={dragstart}></button>
  <div class="right-pane">
    <slot name="right" />
  </div>
</div>

<style>
  .split-pane {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .left-pane {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .right-pane {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

	.splitter {
		width: 5px;
		background-color: #ccc; /* Light gray color for light mode */
		cursor: col-resize;
		flex-shrink: 0;
		border: none;
		outline: none;
		padding: 0;
	}

	.splitter:focus,
	.splitter:active {
		background-color: #ccc;
		outline: none;
	}

	/* Apply dark mode styling */
	:global(.dark) .left-pane,
	:global(.dark) .right-pane {
		background-color: var(--skeleton-dark-surface);
	}

	:global(.dark) .splitter {
		background-color: #444;
	}

	:global(.dark) .splitter:focus,
	:global(.dark) .splitter:active {
		background-color: #444;
		outline: none;
	}
</style>
