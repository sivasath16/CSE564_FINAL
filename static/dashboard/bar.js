let tooltip = d3.select('body').append('div')
  .attr('class', 'd3-tooltip')
  .style('position', 'absolute')
  .style('z-index', '10')
  .style('visibility', 'hidden')
  .style('padding', '10px')
  .style('background', 'rgba(0,0,0,0.6)')
  .style('border-radius', '4px')
  .style('color', '#fff');

let staticColor = '#69b3a2';
let hoverColor = '#eec42d';

// Load the data
d3.csv("/final_project/dataset/dataset.csv").then(function(data) {
  const types = Array.from(new Set(data.map(d => d['types of cancer'])));
  const years = Array.from(new Set(data.map(d => +d.Year))).sort(d3.ascending);

  // Create year slider
  const sliderValueDisplay = d3.select("#sliderValue");
  sliderValueDisplay.text(d3.min(years));
  const slider = d3.select("#slider").append("input")
      .attr("type", "range")
      .attr("min", d3.min(years))
      .attr("max", d3.max(years))
      .attr("value", d3.min(years))
      .attr("step", 1)
      .on("input", function() {
          updateChart(+this.value);
          sliderValueDisplay.text(this.value);
      });

  // Function to update the chart
  function updateChart(selectedYear) {
      const filteredData = data.filter(d => +d.Year === selectedYear);
      drawBarChartVertical(filteredData, 'types of cancer');
  }

  // Initial chart
  updateChart(d3.min(years));
});

function drawBarChartVertical(data, selectedColumn) {
  const margin = {top: 10, right: 30, bottom: 70, left: 60},
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svgContainer = d3.select('#bar');
  svgContainer.selectAll('*').remove();

  const frequencyMap = d3.rollup(data, v => d3.sum(v, d => +d['number of ppl with cancer']), d => d[selectedColumn]);
  const frequencyArray = Array.from(frequencyMap, ([key, value]) => ({ key, value }));
  frequencyArray.sort((a, b) => d3.ascending(a.key, b.key));

  const xscale = d3.scaleBand()
      .domain(frequencyArray.map(d => d.key))
      .range([0, width])
      .padding(0.1);

  const yscale = d3.scaleLinear()
      .domain([0, d3.max(frequencyArray, d => d.value)])
      .range([height, 0]);

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
        tooltip
          .html(`<div>${selectedColumn}: ${d.key}</div><div>Value: ${d.value}</div>`)
          .style('visibility', 'visible');
        d3.select(this).attr('fill', hoverColor);
      })
      .on('mousemove', function (event, d) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function (d) {
        tooltip.style('visibility', 'hidden');
        d3.select(this).attr('fill', staticColor);
      });

  svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xscale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

  svg.append("g")
      .call(d3.axisLeft(yscale));
}
