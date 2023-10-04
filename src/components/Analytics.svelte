<!-- Analytics.svelte -->
<script>
  import { onMount } from 'svelte';

  onMount(() => {
    // Check if the script has already been added
    if (document.querySelector('script[src="https://www.googletagmanager.com/gtag/js?id=G-TP0W3E1DN0"]')) {
      return;
    }

    // Add the first script tag
    let script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-TP0W3E1DN0';
    document.head.appendChild(script1);

    // Add the second script tag after the first script is loaded
    script1.onload = () => {
      let script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-TP0W3E1DN0');
      `;
      document.head.appendChild(script2);
    };
  });
</script>
