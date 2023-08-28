import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';

const FlavorVisualizer = () => {
  const [flavors, setFlavors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const searchbarHeight = 50;
  const [height, setHeight] = useState(window.innerHeight - searchbarHeight);

  const handleSearch = () => {
    setFlavors([searchInput]);
  };

  const updateHeight = () => {
    setHeight(window.innerHeight - searchbarHeight);
  };

  useEffect(() => {
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const responses = await Promise.all(
        flavors.map((flavor) => fetch(`http://localhost:8080/recommend?flavor=${flavor}`))
      );
      const data = await Promise.all(responses.map((res) => res.json()));
      setRecommendations(data.map((d) => (d.recommendations ? d.recommendations : [])));
    };
    fetchData();
  }, [flavors]);

  useEffect(() => {
    const links = recommendations.map((rec, index) => (
      rec.map((pair) => ({ source: flavors[index], target: pair, value: 1 }))
    )).flat();
    const nodes = Array.from(new Set(links.flatMap((l) => [l.source, l.target])), (id) => ({ id }));

    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    const svg = d3.select('#visualization')
      .html('')
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .call(zoom);

    const container = svg.append('g');

    const width = window.innerWidth;
    const optimalDistance = Math.sqrt(width * height / nodes.length);
    const chargeStrength = -30 * nodes.length;
    const nodeRadius = 15;

    const simulation = d3.forceSimulation(nodes)
    .alphaDecay(0.05) // Slower decay rate
    .force('link', d3.forceLink(links).id((d) => d.id).distance(optimalDistance))
    .force('charge', d3.forceManyBody().strength(chargeStrength))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('x', d3.forceX(width / 2))
    .force('y', d3.forceY(height / 2));

    const link = container.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => Math.sqrt(d.value));

      const node = container.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged));

    node.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', '#6699cc');

    node.append('text')
      .attr('stroke', 'none')
      .attr('fill', '#000')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text((d) => d.id);

    // Add double-click listener to release nodes
    node.on('dblclick', releaseNode);

    simulation.on('tick', () => {
      link.attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x)
          .attr('y2', (d) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
      simulation.alpha(0.3).restart(); // Reset alpha to keep the simulation going while dragging
    
      // Stop the simulation after 3 seconds
      setTimeout(() => {
        simulation.alphaTarget(0).restart();
      }, 3000); // 3000 milliseconds = 3 seconds
    }

    function releaseNode(event, d) {
      event.preventDefault();
      d.fx = null;
      d.fy = null;
      simulation.alphaTarget(0); // Gradually stop the simulation
    }

  }, [recommendations]);

  return (
    <div>
      <div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for a flavor..."
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      <div id="visualization"></div>
    </div>
  );
};

export default FlavorVisualizer;