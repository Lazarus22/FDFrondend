<script lang="ts">
	export let leftInitialSize = '75%';

	let left;
	let isDragging = false;

	function dragstart(event) {
		event.preventDefault();
		isDragging = true;
		document.addEventListener('mousemove', drag);
		document.addEventListener('mouseup', dragend);
	}

	function drag(event) {
		if (!isDragging) return;

		const containerWidth = left.parentElement.offsetWidth;
		const newLeftWidth = (event.clientX - left.parentElement.getBoundingClientRect().left) / containerWidth * 100;

		// Ensure the panes don't collapse
		if (newLeftWidth < 10) {
			left.style.width = '10%';
		} else if (newLeftWidth > 90) {
			left.style.width = '90%';
		} else {
			left.style.width = `${newLeftWidth}%`;
		}
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
	<button 
		class="splitter" 
		aria-label="Resize panel" 
		on:mousedown={dragstart}
	></button>
	<div class="right-pane">
		<slot name="right" />
	</div>
</div>

<style>
	.split-pane {
		display: flex;
		width: 100%;
		height: 100vh; /* Ensure it takes the full height */
	}

	.left-pane {
		background-color: var(--skeleton-surface);
		height: 100%;
		overflow: hidden;
		user-select: none;
	}

	.right-pane {
		background-color: var(--skeleton-surface);
		flex-grow: 1;
		height: 100%;
		overflow-y: auto;
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
