document.addEventListener('DOMContentLoaded', function () {
  let tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('visibility', 'hidden')
      .style('padding', '10px')
      .style('background', 'rgba(0,0,0,0.6)')
      .style('border-radius', '4px')
      .style('color', '#fff');

  let staticColor = 'steelblue';
  let hoverColor = '#eec42d';

  d3.csv("/static/dataset/dataset.csv").then(function (data) {
      const types = Array.from(new Set(data.map(d => d['types of cancer'])));

      function updateChart(selectedYear) {
          const filteredData = data.filter(d => +d.Year === selectedYear);
          drawBarChartVertical(filteredData, 'types of cancer');
      }

      const initialYear = +document.getElementById("yearSlider").value;
      updateChart(initialYear);

      document.getElementById("yearSlider").addEventListener("input", function () {
          const selectedYear = +this.value;
          updateChart(selectedYear);
          document.getElementById("sliderValue").textContent = selectedYear;
      });
  }).catch(error => {
      console.error("Error loading CSV data:", error);
  });

  function drawBarChartVertical(data, selectedColumn) {
      const margin = {top: 10, right: 30, bottom: 120, left: 100},
          width = 700 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

      const svgContainer = d3.select('#bar');
      svgContainer.selectAll('*').remove();

      const frequencyMap = d3.rollup(data, v => d3.sum(v, d => +d['cancer population']), d => d[selectedColumn]);
      const frequencyArray = Array.from(frequencyMap, ([key, value]) => ({ key, value }));
      frequencyArray.sort((a, b) => d3.descending(a.value, b.value));

      const xscale = d3.scaleBand()
          .domain(frequencyArray.map(d => d.key))
          .range([0, width])
          .padding(0.1);

      const yscale = d3.scaleLinear()
          .domain([0, d3.max(frequencyArray, d => d.value)])
          .range([height, 0])
          .nice();

      const svg = svgContainer
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);

      svg.selectAll("rect")
          .data(frequencyArray)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", d => xscale(d.key))
          .attr("y", d => yscale(d.value))
          .attr("width", xscale.bandwidth())
          .attr("height", d => height - yscale(d.value))
          .attr('fill', staticColor)
          .on('mouseover', function (event, d) {
              tooltip.html(`<div>${selectedColumn}: ${d.key}</div><div>Value: ${d.value}</div>`)
                  .style('visibility', 'visible');
              d3.select(this).attr('fill', hoverColor);
          })
          .on('mousemove', function (event) {
              tooltip
                  .style('top', (event.pageY - 10) + 'px')
                  .style('left', (event.pageX + 10) + 'px');
          })
          .on('mouseout', function () {
              tooltip.style('visibility', 'hidden');
              d3.select(this).attr('fill', staticColor);
          });
      svg.append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(xscale))
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .style("font-weight", "bold")

      svg.append("g")
          .call(d3.axisLeft(yscale));

      svg.append("text")
          .attr("transform", `translate(${width / 2},${height + margin.top + 100})`)
          .style("text-anchor", "middle")
          .text(`${selectedColumn}`);

      svg.append("text")
          .attr("y", -margin.left + 20)
          .attr("x", -height / 2)
          .attr("transform", "rotate(-90)")
          .style("text-anchor", "middle")
          .text("No of ppl with cancer");
  }
});

